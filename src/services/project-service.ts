import {ux} from "@oclif/core";
import * as fs from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";

import {AgentsService} from "./agents-service";
import {HelpService} from "./help-service";
import {ChatMonitorService} from "./chat-monitor-service";

// eslint-disable-next-line new-cap
@Service()
export class ProjectService {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private helpService: HelpService,
        private agentsService: AgentsService,
        private chatMonitorService: ChatMonitorService
    ) {}

    async ensureDirectoriesExist() {
        const directories = ['ai/prompts/tools', 'ai/prompts/agents', 'ai/chats'];
        let displayMessage = false;

        for (const dir of directories) {
            const dirPath = path.resolve(dir);

            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(ux.colorize('green', `Created directory: ${dirPath}`));
                displayMessage = true;
            }
        }

        if (displayMessage) {
            await this.helpService.displayNewProjectHelpMessage();
        }
    }

    async initialize() {
        await ux.action.start('Initializing dev-copilot project');

        await this.ensureDirectoriesExist();
        await this.agentsService.initialize();
        await this.chatMonitorService.initialize();

        await ux.action.stop();
    }
}