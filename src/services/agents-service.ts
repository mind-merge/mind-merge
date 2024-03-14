import { ux } from "@oclif/core";
import * as chokidar from 'chokidar';
import * as matter from 'gray-matter';
import { Liquid } from "liquidjs";
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Service } from "typedi";

import { Agent } from '../model';
import { ModelService } from "./model-service";

// eslint-disable-next-line new-cap
@Service()
export class AgentsService {
    agents: Map<string, Agent> = new Map();
    private watcher: chokidar.FSWatcher | undefined;

    constructor(
        private modelService: ModelService,
    ) { }

    async getAgent(name: string): Promise<Agent> {
        return <Agent>this.agents.get(name);
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

        let filePath, format, fileContent, parsedContent;
        if (fs.existsSync(agentFile)) {
            filePath = agentFile;
            format = 'md';
            fileContent = fs.readFileSync(filePath, 'utf8');
            parsedContent = matter(fileContent);
        }
        else if (fs.existsSync(agentLiquidFile)) {
            filePath = agentLiquidFile;
            format = 'liquid';
            fileContent = fs.readFileSync(filePath, 'utf8');
            const engine = new Liquid();
            parsedContent = await engine.parseAndRender(fileContent)
            .then((renderedContent) => matter(renderedContent))
            .catch((error) => {
                console.error(error);
            });
        }
        else {
            return;
        }

        if (!parsedContent) return;

        const model = await this.modelService.getModel(parsedContent.data.model);

        const agent = new Agent(
            parsedContent.data.name,
            agentDir,
            format,
            parsedContent.data.description,
            parsedContent.content,
            model,
            parsedContent.data.inputData,
            parsedContent.data.outputData,
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

}