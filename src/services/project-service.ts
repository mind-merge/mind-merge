import {ux} from "@oclif/core";
import * as fs from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";

import {AgentService} from "./agent-service";
import {ChatMonitorService} from "./chat-monitor-service";
import {HelpService} from "./help-service";
import {ToolService} from "./tool-service";

// eslint-disable-next-line new-cap
@Service()
export class ProjectService {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private helpService: HelpService,
        private agentsService: AgentService,
        private chatMonitorService: ChatMonitorService,
        private toolsService: ToolService
    ) {}

    async ensureDirectoriesExist() {
        const directories = ['ai/tools', 'ai/prompts/agents', 'ai/chats', 'ai/prompts/partials'];
        let displayMessage = false;

        for (const dir of directories) {
            const dirPath = path.resolve(dir);

            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(ux.colorize('green', `Created directory: ${dirPath}`));
                displayMessage = true;
            }
            const gitKeepFilePath = `${dirPath}/.gitkeep`;
            if (!fs.existsSync(gitKeepFilePath)) {
                fs.writeFileSync(gitKeepFilePath, ''); // create .gitkeep file if it doesn't exist
            }
        }

        if (displayMessage) {
            await this.helpService.displayNewProjectHelpMessage();
        }
    }

    async initialize() {
        await ux.action.start('Initializing mind-merge project');

        await this.ensureDirectoriesExist();
        await this.agentsService.initialize();
        await this.chatMonitorService.initialize();
        this.toolsService.initialize();

        await ux.action.stop();
    }
}