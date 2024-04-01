## Agent Model Summary
```typescript
export class Agent {
    baseDir: string;
    description: string;
    fileName: string;
    format: string;
    inputData?: string;
    model?: string;
    name: string;
    outputData?: string;
    prompt: string;


    // eslint-disable-next-line max-params
    constructor(name: string, fileName: string, baseDir: string, format:string, description: string, prompt: string,
                model?: string, inputData?: string, outputData?: string) {
        this.name = name;
        this.fileName = fileName;
        this.baseDir = baseDir;
        this.format = format;
        this.description = description;
        this.prompt = prompt;
        this.model = model;
        this.inputData = inputData;
        this.outputData = outputData;
    }
}
```

## Agent Service Summary
```typescript
import {ux} from "@oclif/core";
import * as chokidar from 'chokidar';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";

import {Agent} from '../model';

import matter = require("gray-matter");
import {ToolsService} from "./tools-service";

// eslint-disable-next-line new-cap
@Service()
export class AgentsService {
    agents: Map<string, Agent> = new Map<string, Agent>();
    private watcher: chokidar.FSWatcher | undefined;

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private toolsService: ToolsService
    ) {}

    async getAgent(name: string): Promise<Agent> {
        return <Agent>this.agents.get(name);
    }

    async handleFileChange(filePath: string): Promise<void> {
        const agentsDir = path.resolve('ai/prompts/agents');
        if (!filePath.startsWith(agentsDir)) {
            return;
        }

        const relativePath = path.relative(agentsDir, filePath);
        const agentName = relativePath.split(path.sep)[0];
        const agentDir = path.join(agentsDir, agentName);
        await this.loadAgent(agentDir, agentName);
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
            parsedContent.data.inputData,
            parsedContent.data.outputData
        );

        this.agents.set(agent.name, agent);
        this.toolsService.parseAgentTools(agent.name, agentDir);
        ux.log(`Loaded agent: ${agent.name}(${filePath})`)
    }

    async loadAgents():Promise<void> {
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
```
