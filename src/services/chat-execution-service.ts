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
                            const newMessage = new Message(Role.USER, tool.output, new Date());
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
        for (const [i, output] of toolsCalled.entries()) {
            let str = `\n\n---\n# Tool\n## Tool ${output.name} output:\n`;
            str += "```text\n"+outputs[i]+"\n```\n\n---\n";

            fs.appendFileSync(filePath, str);
            console.log(ux.colorize('green', `\nAppended tool ${output.name} output to file: ${filePath}`));
            process.stdout.write(str);
            ret.push({
                args: output.args,
                chatMessage: str,
                name: output.name,
                output: outputs[i],
                stdin: output.stdin
            });
        }

        return { output, toolsCalled: ret } ;
    }

    private async executeChatRequest(agent: Agent, request: ChatCompletionRequest, filePath: string) {
        const model = await this.modelService.getModel(agent.model ?? 'gpt-4-preview');
        const apiData = await model.completeChatRequest(request);
        return this.processModelOutput(apiData, filePath);
    }
}