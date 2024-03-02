import { ux } from "@oclif/core";
import * as chokidar from 'chokidar';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Service } from "typedi";
import { ChatParserService } from "./chat-parser-service";
import { ModelService } from "./model-service";

// eslint-disable-next-line new-cap
@Service()
export class ChatMonitorService {
    constructor(
        private chatParserService: ChatParserService,
        private modelService: ModelService,
    ) { }
    private processingFiles: Set<string> = new Set();
    private watcher: chokidar.FSWatcher | undefined;

    async initialize() {
        const chatsDir = path.resolve('ai/chats');
        this.watcher = chokidar.watch(chatsDir, { ignored: '**/resources/**', persistent: true });

        this.watcher
            .on('add', (filePath) => this.handleFileChange(filePath))
            .on('change', (filePath) => this.handleFileChange(filePath));

        ux.log(`Started monitoring chat files in: ${chatsDir}`)
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

   /* async processChat(filePath: string, fileContent: string) {
        ux.log(`Processing chat file: ${filePath}`);
        // append answer to file
        const answer = "This is a test answer\n";
        // simulate delay
        const end = async function () {
            setTimeout(() => {
                fs.appendFileSync(filePath, '# Agent\n\n');
                fs.appendFileSync(filePath, answer);
                console.log(ux.colorize('green', `Appended answer to file: ${filePath}`));
                setTimeout(() => {
                    fs.appendFileSync(filePath, answer+" 2 \n");
                    console.log(ux.colorize('green', `Appended answer to file: ${filePath}`));
                }, 500)
                setTimeout(() => {
                    fs.appendFileSync(filePath, answer+" 3 \n");
                    console.log(ux.colorize('green', `Appended answer to file: ${filePath}`));
                }, 1000)
                setTimeout(() => {
                    fs.appendFileSync(filePath, answer+" 4 \n");
                    console.log(ux.colorize('green', `Appended answer to file: ${filePath}`));
                }, 1500)
                setTimeout(() => {
                    fs.appendFileSync(filePath, answer+" 5 \n");
                    console.log(ux.colorize('green', `Appended answer to file: ${filePath}`));
                }, 2000)
            }, 2000)
        };

        await end();
    }*/

    async processChat(filePath: string, fileContent: string) {
        ux.log(`Processing chat file: ${filePath}`);

        if (fileContent) {
            let chat: any = await this.chatParserService.parseChatFile(filePath);
            const agent = chat ? chat.agent : null;
            if (agent) {
                let data: any = [];
                let systemData = `name: ${agent.name}, description: ${agent.description}, inputData: ${agent.inputData}, outputData: ${agent.outputData}`;
                data.push({ role: 'system', content: systemData });

                let optionsData: any = { filePath };
                if (agent.temperature) optionsData['temperature'] = agent.temperature;
                if (agent.max_tokens) optionsData['max_tokens'] = agent.max_tokens;

                const content = fileContent.split('# User').slice(-1).join('');
                data.push({ role: 'user', content });

                const model = await this.modelService.getModel(agent.model);
                await model?.completeChatRequest(data, optionsData);
            }
        }
    }
}