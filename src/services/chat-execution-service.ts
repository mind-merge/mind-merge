import {ux} from "@oclif/core";
import * as fs from 'node:fs';
import {Service} from "typedi";

import {Agent, Chat, Message, Role, AsyncIterableChunk, Task, Provider} from '../model';
import {ChatParserService} from "./chat-parser-service";
import {EditorInteractionService} from "./editor-interaction-service";
import {GlobalFlagsService} from "./global-flags-service";
import {ModelService} from "./model-service";
import {TaskService} from "./task-service";
import {TemplateService} from "./template-service";
import {PendingToolCall, ToolCall, ToolService} from "./tool-service";

import matter = require("gray-matter");

interface ChatProcessingOutput {
    output: string;
    tasksCreated: Array<Task>;
    toolsCalled: Array<ToolCall>;
}

// eslint-disable-next-line new-cap
@Service()
export class ChatExecutionService {

    private processingFiles: Set<string> = new Set();

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private chatParserService: ChatParserService,
        private modelService: ModelService,
        private templateService: TemplateService,
        private toolsService: ToolService,
        private taskService: TaskService,
        private globalFlagsService: GlobalFlagsService,
        private editorInteractionService: EditorInteractionService
    ) { }

    async generateChatCompletionRequest(chat:Chat): Promise<Message[]> {
        // Check if agent format is liquid or md
        let tools = [...this.toolsService.getAllGlobalTools(), ...this.toolsService.getAgentTools(chat.agent.name)];

        const templateData = {
            chatFile: chat.fileName,
            currentDateTime: new Date(),
            referencedFiles: chat.referencedFiles,
            tools
        };
        const rendered = await this.templateService.parseTemplateFileAsync(chat.agent.fileName, templateData);
        const systemPrompt = matter(rendered).content;

        const data: Message[] = [new Message(Role.SYSTEM, systemPrompt, new Date()), ...chat.messages];
        return data;
    }

    async processChatCompletionRequestOutput(chat: Chat, data: AsyncIterableChunk, filePath: string): Promise<ChatProcessingOutput> {
        let output: string = '';
        let toolBufferPart: string = '';
        let taskBufferPart: string = '';
        let taskOutputBufferPart: string = '';
        const pendingToolCalls: Array<PendingToolCall> = [];
        const tasksCreated: Array<Task> = [];
        let breaking = false;
        fs.appendFileSync(filePath, '# Agent\n\n');
        
        for await (const chunk of data) {
            let deltaContent = chunk?.choices?.[0]?.delta?.content || chunk?.delta?.text || chunk?.text?.();
            if (!deltaContent) continue;

            output += deltaContent.toString();
            toolBufferPart += deltaContent.toString();
            taskBufferPart += deltaContent.toString();
            taskOutputBufferPart += deltaContent.toString();

            if(taskBufferPart.includes('```task\n')) breaking = true;

            // check for start and end of tool call tags
            const toolCallMatch = toolBufferPart.match(/```tool\n([\S\s]*?)\n```/im);
            if (toolCallMatch) {
                breaking = false;
                const toolCall = toolCallMatch[0];
                const tool = this.toolsService.parseCallAndStartToolExecution(toolCall);
                pendingToolCalls.push(tool);
                toolBufferPart = '';
            }

            if (!breaking) {
                fs.appendFileSync(filePath, deltaContent);
                process.stdout.write(deltaContent.toString());
            }

            const taskCallMatch = taskBufferPart.match(/```task\n([\S\s]*?)\n```/im);
            if (taskCallMatch) {
                const taskCall = taskCallMatch[0];
                const task = this.taskService.parseCallAndStartTaskExecution(taskCall, filePath);

                if (task) {
                    // Here we append a reference to the task chat file instead of the task details
                    fs.appendFileSync(filePath, `\nSee task details in: ${task.chatFilePath}\n`);
                    tasksCreated.push(task);
                }
                else
                    ux.logToStderr(ux.colorize('red', `Task parsing failed for task call: ${taskCall}`))
                taskBufferPart = '';
            }

            const taskOutputMatch = taskOutputBufferPart.match(/```task-output\n([\S\s]*?)\n```/im);
            if (taskOutputMatch) {
                taskOutputBufferPart = '';
                const taskOutput = taskOutputMatch[0];
                this.taskService.parseTaskOutputBlock(chat, taskOutput);
            }
        }

        const ret:ChatProcessingOutput = { output, tasksCreated, toolsCalled: [] };

        if (pendingToolCalls.length > 0) {
            ret.toolsCalled = await this.toolsService.processTools(pendingToolCalls, filePath);
        }

        return ret;
    }

    async startChatProcessing(filePath: string, fileContent: string) {
        if (this.processingFiles.has(filePath)) {
            ux.log(`File ${filePath} is already being processed.`);
            return;
        }

        ux.log(`Processing chat file: ${filePath}`);
        if (!fileContent) {
            ux.logToStderr(ux.colorize('red', `Chat file ${filePath} is empty.`));
            return;
        }

        const chat: Chat|undefined = await this.chatParserService.parseChatFile(filePath);
        if (!chat) {
            ux.logToStderr(ux.colorize('red', `Chat file ${filePath} could not be parsed.`));
            return;
        }
        
        const agent = chat ? chat.agent : null;
        if (!agent) {
            ux.logToStderr(ux.colorize('red', `Agent ${chat.agent.name} not found, chat could not be loaded`));
            return;
        }

        this.processingFiles.add(filePath);
        try {
            const maxToolCalls = (this.globalFlagsService.getFlag('maxToolCalls') ?? 5) as number;
            let toolCalls = 0;

            let request = await this.generateChatCompletionRequest(chat);
            let apiData = await this.executeChatCompletionRequest(agent, request) as AsyncIterableChunk;
            let output = await this.processChatCompletionRequestOutput(chat, apiData, filePath);

            // First we handle tool calls
            while (output.toolsCalled.length > 0 && toolCalls < maxToolCalls) {
                for (const tool of output.toolsCalled) {
                    const newMessage = new Message(Role.USER, tool.chatMessage, new Date());
                    chat.messages.push(newMessage);
                }

                // eslint-disable-next-line no-await-in-loop
                request = await this.generateChatCompletionRequest(chat);
                // eslint-disable-next-line no-await-in-loop
                apiData = await this.executeChatCompletionRequest(agent, request) as AsyncIterableChunk;
                // eslint-disable-next-line no-await-in-loop
                output = await this.processChatCompletionRequestOutput(chat, apiData, filePath);
                toolCalls++;
            }

            fs.appendFileSync(filePath, '\n\n---\n# User\n');
            console.log(ux.colorize('green', `\nAppended answer to file: ${filePath}`));
            this.editorInteractionService.openChatFileInEditor(filePath);
        } catch (error) {
            console.error(error);
        }
        this.processingFiles.delete(filePath);
    }

    private async executeChatCompletionRequest(agent: Agent, request: Message[])  {
        const model = await this.modelService.getModel(agent.provider ?? Provider.OpenAI, agent.model ?? 'gpt-4-preview');
        return model.completeChatRequest(request);
    }
}