import {ux} from "@oclif/core";
import * as chokidar from 'chokidar';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";

// eslint-disable-next-line new-cap
@Service()
export class ChatMonitorService {
    private processingFiles: Set<string> = new Set();
    private watcher: chokidar.FSWatcher | undefined;

    initialize() {
        const chatsDir = path.resolve('chats');
        this.watcher = chokidar.watch(chatsDir, { ignored: '**/resources/**', persistent: true });

        this.watcher
            .on('add', (filePath) => this.handleFileChange(filePath))
            .on('change', (filePath) => this.handleFileChange(filePath));

        ux.log(`Started monitoring chat files in: ${chatsDir}`)
    }

    private async handleFileChange(filePath: string) {
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

    private async processChat(filePath: string, fileContent: string) {
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
    }
}