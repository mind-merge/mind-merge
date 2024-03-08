import { ux } from "@oclif/core";
import * as chokidar from 'chokidar';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Service } from "typedi";

import { Chat } from "../model";
import { ChatParserService } from "./chat-parser-service";
import { ModelService } from "./model-service";

// eslint-disable-next-line new-cap
@Service()
export class ChatMonitorService {

    private processingFiles: Set<string> = new Set();
    private watcher: chokidar.FSWatcher | undefined;

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private chatParserService: ChatParserService,
        private modelService: ModelService,
    ) { }

    // TODO: use types
    async appendChunksToChatFile(data: any, filePath: string) {
        fs.appendFileSync(filePath, '# Agent\n\n');
        for await (const chunk of data) {
            for (const choice of chunk.choices) {
                if (choice.delta && choice.delta.content) {
                    const deltaContent = choice.delta.content;
                    fs.appendFileSync(filePath, deltaContent);
                    process.stdout.write(deltaContent.toString());
                }
            }
        }

        fs.appendFileSync(filePath, '\n\n# User\n\n');
        console.log(ux.colorize('green', `\nAppended answer to file: ${filePath}`));
    }

    async handleFileChange(filePath: string) {
        if (path.extname(filePath) !== '.md' || this.processingFiles.has(filePath)) {
            return;
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');

        if (fileContent.endsWith("\n---\n")) {
            this.processingFiles.add(filePath);
            await this.processChat(filePath, fileContent);
            this.processingFiles.delete(filePath);
        }
    }

    async initialize() {
        const chatsDir = path.resolve('ai/chats');
        this.watcher = chokidar.watch(chatsDir, { ignored: '**/resources/**', persistent: true });

        this.watcher
            .on('add', (filePath) => this.handleFileChange(filePath))
            .on('change', (filePath) => this.handleFileChange(filePath));

        ux.log(`Started monitoring chat files in: ${chatsDir}`)
    }

    async processChat(filePath: string, fileContent: string) {
        ux.log(`Processing chat file: ${filePath}`);

        if (fileContent) {
            let chat: Chat|undefined = await this.chatParserService.parseChatFile(filePath);
            const agent = chat ? chat.agent : null;
            if (agent) {
                let data: any = [];
                let systemData =
                    `name: ${agent.name}, description: ${agent.description}, inputData: ${agent.inputData}, outputData: ${agent.outputData}`;
                data.push({ role: 'system', content: systemData });

                let optionsData: any = {};
                if (agent.temperature) optionsData['temperature'] = agent.temperature;
                if (agent.max_tokens) optionsData['max_tokens'] = agent.max_tokens;

                const content = fileContent.split('# User').slice(-1).join('');
                data.push({ role: 'user', content });

                const model = await this.modelService.getModel(agent.model);
                const apiData = await model.completeChatRequest(data, optionsData);
                await this.appendChunksToChatFile(apiData, filePath);
            }
        }
    }
}