import {ux} from "@oclif/core";
import * as fs from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";

import {AgentService} from "./agent-service";
import {ChatMonitorService} from "./chat-monitor-service";
import {HelpService} from "./help-service";
import {ToolService} from "./tool-service";
import {ChatExecutionService} from "./chat-execution-service";
import {WatcherService} from "./watcher-service";

// eslint-disable-next-line new-cap
@Service()
export class ProjectService {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private helpService: HelpService,
        private agentsService: AgentService,
        private chatMonitorService: ChatMonitorService,
        private chatExecutionService: ChatExecutionService,
        private toolsService: ToolService,
        private watcherService: WatcherService,
    ) {}

    async ensureDirectoriesExist() {
        const directories = ['ai/tools', 'ai/prompts/agents','ai/prompts/agents/main', 'ai/chats', 'ai/prompts/partials'];
        let displayMessage = false;

        for (const dir of directories) {
            const dirPath = path.resolve(dir);

            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(ux.colorize('green', `Created directory: ${dirPath}`));
                displayMessage = true;
            }

            // create .gitkeep file if it doesn't exist
            if(['ai/tools', 'ai/prompts/agents', 'ai/prompts/partials'].includes(dir)){
                const gitKeepFilePath = `${dirPath}/.gitkeep`;
                if (!fs.existsSync(gitKeepFilePath)) {
                    fs.writeFileSync(gitKeepFilePath, '');
                }
            }

            // create main agent file if it doesn't exist
            if(['ai/prompts/agents/main'].includes(dir)){
                const mainAgentFilePath = `${dirPath}/main.md.liquid`;
                if (!fs.existsSync(mainAgentFilePath)) {
                    const defaultContent = `---\nname: main\nmodel: gpt-4-turbo-preview\n---\nYou are an agent that helps the user with his request.`
                    fs.writeFileSync(mainAgentFilePath, defaultContent);
                }
            }
        }

        if (displayMessage) {
            await this.helpService.displayNewProjectHelpMessage();
        }
    }

    async initialize() {
        ux.action.start('Initializing mind-merge project');

        await this.ensureDirectoriesExist();
        await this.agentsService.initialize();
        await this.chatMonitorService.initialize();
        await this.toolsService.initialize();

        ux.action.stop();
    }


    async kickoff(chatFile:string) {
        ux.action.start('Loading mind-merge files');

        await this.ensureDirectoriesExist();
        this.watcherService.setEnableChangeListeners(false);
        await this.agentsService.initialize();
        if (path.extname(chatFile) !== '.md') {
            console.error('Invalid chat file. Chat file must be a markdown file with a .md extension');
            return;
        }

        let content = fs.readFileSync(chatFile, 'utf8');
        // Check if file ends in "\n---\n", if it doesn't append it to the end of the file
        if (!content.endsWith("\n---\n")) {
            console.warn('Chat file does not end with "---", appending...');
            content += "\n---\n";
            fs.writeFileSync(chatFile, content);
        }

        ux.action.stop();

        ux.log(ux.colorize('green', `Starting chat processing for file: ${chatFile}`))

        await this.chatExecutionService.startChatProcessing(chatFile, content);

        this.watcherService.unregisterAllWatchers();
    }
}