import {ux} from "@oclif/core";
import * as fs from 'node:fs';
import {ChatCompletionChunk} from "openai/resources";
import {Stream} from "openai/streaming";
import {Service} from "typedi";

import {Agent, Chat, Message, Role} from '../model';
import {ChatCompletionRequest} from "../model/model";
import {AgentsService} from './agents-service';
import {ChatParserService} from "./chat-parser-service";
import {ModelService} from "./model-service";
import {TemplateService} from "./template-service";
import {ToolsService} from "./tools-service";

import matter = require("gray-matter");
import * as path from "node:path";

// eslint-disable-next-line new-cap
@Service()
export class ChatExecutionService {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private chatParserService: ChatParserService,
        private modelService: ModelService,
        private agentsService: AgentsService,
        private templateService: TemplateService,
        private toolsService: ToolsService
    ) { }

    async prepareChatForModel(chat:Chat): Promise<ChatCompletionRequest> {
        // Check if agent format is liquid or md
        let tools = this.toolsService.getAllGlobalTools();
        tools=[...tools, ...this.toolsService.getAgentTools(chat.agent.name)];

        const templateData = {
            chatFile: chat.fileName,
            currentDateTime: new Date(),
            referencedFiles: chat.referencedFiles,
            tools
        };
        const rendered = await this.templateService.parseTemplateFileAsync(chat.agent.fileName, templateData);
        const systemPrompt = matter(rendered).content;

        const data: Message[] = [];
        data.push(new Message(Role.SYSTEM, systemPrompt, new Date()));
        for (const message of chat.messages) {
            data.push(message);
        }

        return {
            messages: data
        } as ChatCompletionRequest;
    }

    async processChat(filePath: string, fileContent: string) {
        ux.log(`Processing chat file: ${filePath}`);

        if (fileContent) {
            const chat: Chat|undefined = await this.chatParserService.parseChatFile(filePath);
            const agent = chat ? chat.agent : null;
            if (chat && agent) {
                try {
                    const maxToolCalls = process.env.MAX_TOOL_CALLS ? Number.parseInt(process.env.MAX_TOOL_CALLS, 10) : 5;
                    let toolCalls = 0;

                    let request = await this.prepareChatForModel(chat);
                    let output = await this.executeChatRequest(agent, request, filePath);

                    while (output.toolsCalled.length > 0 && toolCalls < maxToolCalls) {
                        for (const tool of output.toolsCalled) {
                            const newMessage = new Message(Role.USER, tool.chatMessage, new Date());
                            chat.messages.push(newMessage);
                        }

                        // eslint-disable-next-line no-await-in-loop
                        request = await this.prepareChatForModel(chat);
                        // eslint-disable-next-line no-await-in-loop
                        output = await this.executeChatRequest(agent, request, filePath);
                        toolCalls++;
                    }

                    fs.appendFileSync(filePath, '\n\n---\n# User\n');
                    console.log(ux.colorize('green', `\nAppended answer to file: ${filePath}`));
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }

    async processModelOutput(data: Stream<ChatCompletionChunk>, filePath: string):Promise<{output: string, toolsCalled: Array<{args: null | string[], chatMessage: string, name: string, output: string, stdin: null | string}>}> {
        let output:string = '';
        let outputPart:string = '';
        const toolsCalled: Array<{args: null | string[], name: string, output: Promise<string>, stdin: null | string}> = [];
        fs.appendFileSync(filePath, '# Agent\n\n');
        for await (const chunk of data) {
            for (const choice of chunk.choices) {
                if (choice.delta && choice.delta.content) {
                    const deltaContent = choice.delta.content;
                    fs.appendFileSync(filePath, deltaContent);
                    process.stdout.write(deltaContent.toString());
                    output += deltaContent.toString();
                    outputPart += deltaContent.toString();
                    // check for start and end of tool call tags

                    const toolCallMatch = outputPart.match(/```tool\n([\S\s]*?)\n```/im);
                    if (toolCallMatch) {
                        const toolCall = toolCallMatch[0];
                        const tool = this.toolsService.parseCallAndStartToolExecution(toolCall);
                        toolsCalled.push(tool);
                        outputPart = '';
                    }
                }
            }
        }

        if (toolsCalled.length === 0) return { output, toolsCalled: [] };

        const ret = [];
        // Wait for all tools to finish
        const outputPromises = toolsCalled.map(async (tool) => tool.output);
        const outputs = await Promise.all(outputPromises);
        for (const [i, tool] of toolsCalled.entries()) {
            const toolOutputFilename = this.generateToolOutputFilename(filePath, tool.name);
            this.saveToolOutputToFile(outputs[i], toolOutputFilename.filePath);

            const header = `# Tool ${tool.name}\nHere is the output of the tool you called, please check if it completed successfully and try to fix it if it didn't.\n`;
            const chatMessage = `${header}---\n${outputs[i]}\n---\n`;
            const fileMessage = `\n\n---\n${header}[Tool ${tool.name} output](${toolOutputFilename.shortPath})\n\n---\n`;

            fs.appendFileSync(filePath, fileMessage);

            console.log(ux.colorize('green', `\nTool ${tool.name} output dumped to file: ${toolOutputFilename}`));
            process.stdout.write(fileMessage);
            ret.push({
                ...tool,
                chatMessage,
                output: outputs[i],
            });
        }

        return { output, toolsCalled: ret } ;
    }

    private async executeChatRequest(agent: Agent, request: ChatCompletionRequest, filePath: string) {
        const model = await this.modelService.getModel(agent.model ?? 'gpt-4-preview');
        const apiData = await model.completeChatRequest(request);
        return this.processModelOutput(apiData, filePath);
    }

    private generateToolOutputFilename(chatFile: string, toolName: string): {
        directory: string
        fileName: string;
        filePath: string;
        shortPath: string;
    } {
        // Get directory from chat file, relative to the current working directory
        let directory = path.dirname(chatFile);
        // keep the dir relative to the current working directory
        if (directory.startsWith(process.cwd())) {
            directory = directory.slice(process.cwd().length + 1);
        }

        // Check if `resources` directory exists and create it if it doesn't
        const resourcesDir = path.join(directory, 'resources');
        if (!fs.existsSync(resourcesDir)) {
            fs.mkdirSync(resourcesDir);
        }

        // Generates a unique filename for a tool output in the resources directory
        const timestamp = Date.now();

        return {
            directory: resourcesDir,
            fileName: `${toolName}-${timestamp}.txt`,
            filePath: path.join(resourcesDir, `${toolName}-${timestamp}.txt`),
            shortPath: path.join('resources', `${toolName}-${timestamp}.txt`)
        };
    }

    private saveToolOutputToFile(toolOutput: string, filePath: string) {
        // Saves tool output to a file
        fs.writeFileSync(filePath, toolOutput, 'utf8');
    }

}