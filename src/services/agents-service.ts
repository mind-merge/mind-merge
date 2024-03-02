import {ux} from "@oclif/core";
import * as matter from 'gray-matter';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";
import * as chokidar from 'chokidar';

import {Agent} from '../model';

// eslint-disable-next-line new-cap
@Service()
export class AgentsService {
    agents: Map<string, Agent> = new Map();
    private watcher: chokidar.FSWatcher | undefined;


    async getAgent(name: string): Promise<Agent> {
        return <Agent>this.agents.get(name);
    }

    async initialize() {
        this.loadAgents();
        const agentsDir = path.resolve('ai/prompts/agents');
        this.watcher = chokidar.watch(agentsDir, { persistent: true });

        this.watcher
            .on('add', (filePath) => this.handleFileChange(filePath))
            .on('change', (filePath) => this.handleFileChange(filePath));

        ux.log(`Started monitoring agent files in: ${agentsDir}`)
    }

    async loadAgent(agentDir: string, agentName: string) {
        const agentFile = path.join(agentDir, `${agentName}.md`);
        const agentLiquidFile = path.join(agentDir, `${agentName}.md.liquid`);

        let filePath;
        let format;
        if (fs.existsSync(agentFile)) {
            filePath = agentFile;
            format = 'md';
        } else if (fs.existsSync(agentLiquidFile)) {
            filePath = agentLiquidFile;
            format = 'liquid';
        } else {
            return;
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsedContent = matter(fileContent);

        const agent = new Agent(
            parsedContent.data.name,
            agentDir,
            format,
            parsedContent.data.description,
            parsedContent.content,
            parsedContent.data.model,
            parsedContent.data.inputData,
            parsedContent.data.outputData,
            parsedContent.data.temperature,
            parsedContent.data.max_tokens,
        );

        this.agents.set(agent.name, agent);
        ux.log(`Loaded agent: ${agent.name}(${filePath})`)
    }

    async loadAgents() {
        const agentsDir = path.resolve('ai/prompts');
        const agentNames = fs.readdirSync(agentsDir);

        for (const agentName of agentNames) {
            const agentDir = path.join(agentsDir, agentName);
            const stats = fs.statSync(agentDir);
            if (!stats.isDirectory()) {
                continue;
            }

            this.loadAgent(agentDir, agentName);
        }
    }

    async handleFileChange(filePath: string) {
        const agentsDir = path.resolve('ai/prompts/agents');
        if (!filePath.startsWith(agentsDir)) {
            return;
        }

        const relativePath = path.relative(agentsDir, filePath);
        const agentName = relativePath.split(path.sep)[0];
        const agentDir = path.join(agentsDir, agentName);
        this.loadAgent(agentDir, agentName);
    }

}