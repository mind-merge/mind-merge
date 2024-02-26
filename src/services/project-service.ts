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

    ensureDirectoriesExist() {
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
            this.helpService.displayNewProjectHelpMessage();
        }
    }

    initialize() {
        ux.action.start('Initializing dev-copilot project');
        this.ensureDirectoriesExist();

        this.agentsService.initialize();

        this.chatMonitorService.initialize();

        ux.action.stop();


    }

}