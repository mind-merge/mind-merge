import {ux} from "@oclif/core";
import * as chokidar from 'chokidar';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";

import {Agent} from '../model';
import {ToolService} from "./tool-service";
import { HelpService } from "./help-service";

import matter = require("gray-matter");

// eslint-disable-next-line new-cap
@Service()
export class AgentService {
    agents: Map<string, Agent> = new Map<string, Agent>();
    private watcher: chokidar.FSWatcher | undefined;

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private toolsService: ToolService,
        private helpService: HelpService,
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
        let agentsDirs = await this.helpService.findAiFoldersInNodeModules('node_modules', 'ai/prompts/agents');
        agentsDirs.push(path.resolve('ai/prompts/agents'));
        
        for(let agentsDir of agentsDirs){
            this.watcher = chokidar.watch(agentsDir, { persistent: true });
    
            this.watcher
                .on('add', (filePath) => this.handleFileChange(filePath, agentsDir))
                .on('change', (filePath) => this.handleFileChange(filePath, agentsDir))
    
            ux.log(`Started monitoring agent files in: ${agentsDir}`)
        }
    }

    async loadAgent(agentDir: string, agentName: string) {
        const agentLiquidFile = path.join(agentDir, `${agentName}.md.liquid`);

        let filePath;
        let format;
        if (fs.existsSync(agentLiquidFile)) {
            filePath = agentLiquidFile;
            format = 'liquid';
        } else {
            return;
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
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
        this.toolsService.parseAgentTools(agent.name, agentDir);
        ux.log(`Loaded agent: ${agent.name}(${filePath})`)
    }
}