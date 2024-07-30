import {ux} from "@oclif/core";
import {promises as fs} from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";

import {Agent} from '../model';
import {HelpService} from "./help-service";
import {ToolService} from "./tool-service";
import {WatcherService} from "./watcher-service";

import matter = require("gray-matter");

// eslint-disable-next-line new-cap
@Service()
export class AgentService {
    agents: Map<string, Agent> = new Map<string, Agent>();

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private toolsService: ToolService,
        private helpService: HelpService,
        private watcherService: WatcherService,
    ) {}

    async getAgent(name: string): Promise<Agent> {
        return <Agent>this.agents.get(name);
    }

    async handleFileChange(filePath: string, agentsDir: string): Promise<void> {
        if (!filePath.startsWith(agentsDir)) {
            return;
        }

        const relativePath = path.relative(agentsDir, filePath);
        const agentName = relativePath.split(path.sep)[0];
        const agentDir = path.join(agentsDir, agentName);
        await this.loadAgent(agentDir, agentName);
    }

    async initialize() {
        const agentsDirs = await this.helpService.findAiFoldersInNodeModules('node_modules', 'ai/prompts/agents');
        agentsDirs.push(path.resolve('ai/prompts/agents'));

        const allPromises: Promise<void>[] = [];

        const watcherPromises = agentsDirs.map(agentsDir => {
            return new Promise<void>((resolveWatcher) => {
                const handleFileChangePromises: Promise<void>[] = [];

                this.watcherService.registerWatcher({
                    directory: agentsDir,
                    onAdd: (filePath) => {
                        const promise = this.handleFileChange(filePath, agentsDir);
                        handleFileChangePromises.push(promise);
                        return promise;
                    },
                    onChange: (filePath) => this.handleFileChange(filePath, agentsDir),
                    // eslint-disable-next-line object-shorthand
                    onReady: () => {
                        ux.log(ux.colorize('blue', `Finished scanning agent files in: ${agentsDir}`));
                        Promise.all(handleFileChangePromises).then(() => {
                            ux.log(ux.colorize('blue', `Finished loading all agent files in: ${agentsDir}`));
                            resolveWatcher();
                        });
                    }
                });
            });
        });

        allPromises.push(...watcherPromises);

        await Promise.all(allPromises);
        ux.log(ux.colorize('green', 'All agents have been loaded'));
    }

    async loadAgent(agentDir: string, agentName: string) {
        const agentLiquidFile = path.join(agentDir, `${agentName}.md.liquid`);

        let filePath;
        let format;
        try {
            await fs.access(agentLiquidFile);
            filePath = agentLiquidFile;
            format = 'liquid';
        } catch {
            return;
        }

        ux.log(ux.colorize('yellow', `Loading agent: ${agentName}`));

        const fileContent = await fs.readFile(filePath, 'utf8');
        const parsedContent = matter(fileContent);

        const agent = new Agent(
            parsedContent.data.name,
            filePath,
            agentDir,
            format,
            parsedContent.data.description,
            parsedContent.content,
            parsedContent.data.model,
            parsedContent.data.provider,
            parsedContent.data.inputData,
            parsedContent.data.outputData
        );

        this.agents.set(agent.name, agent);
        await this.toolsService.loadAgentTools(agent.name, agentDir);
        ux.log(`Loaded agent: ${agent.name}(${filePath})`);
    }
}