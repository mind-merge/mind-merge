import {ux} from "@oclif/core";
import * as chokidar from 'chokidar';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";

import {Chat, Message, Role} from "../model";
import {ChatParserService} from "./chat-parser-service";
import {ModelService} from "./model-service";
import {ChatExecutionService} from "./chat-execution-service";

// eslint-disable-next-line new-cap
@Service()
export class ChatMonitorService {

    private processingFiles: Set<string> = new Set();
    private watcher: chokidar.FSWatcher | undefined;

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private chatExecutionService: ChatExecutionService,
    ) { }

    async handleFileChange(filePath: string) {
        if (path.extname(filePath) !== '.md' || this.processingFiles.has(filePath)) {
            return;
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');

        if (fileContent.endsWith("\n---\n")) {
            this.processingFiles.add(filePath);
            await this.chatExecutionService.processChat(filePath, fileContent);
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


}