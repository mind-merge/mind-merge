import {ux} from "@oclif/core";
import * as yaml from 'js-yaml';
import {spawn} from 'node:child_process';
import {promises as fs} from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";

import { HelpService } from "./help-service";
import { WatcherService } from "./watcher-service";

export interface PendingToolCall {
    args: null | string[];
    name: string;
    output: Promise<string>;
    stdin: null | string
}

export interface ToolCall {
    args: null | string[];
    chatMessage: string;
    name: string;
    output: string;
    stdin: null | string;
}

// eslint-disable-next-line new-cap
@Service()
export class ToolService {
    private globalTools: Map<string, any> = new Map();
    private privateTools: Map<string, Map<string, any>> = new Map();

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private helpService: HelpService,
        private watcherService: WatcherService,
    ) {}

    public async executeTool(toolName: string, args: null | string[], agentName?: string | undefined, stdinData: string = ""): Promise<string> {
        let toolConfig = this.globalTools.get(toolName);

        if (agentName) {
            const privateToolConfig = this.privateTools.get(agentName)?.get(toolName);
            if (privateToolConfig) {
                toolConfig = privateToolConfig;
            }
        }

        if (!toolConfig) {
            throw new Error(`Tool '${toolName}' not found.`);
        }

        const toolCommand = `${toolConfig.command} ${args?args.join(' '):''}`;
        ux.log(ux.colorize('green', `Executing tool ${toolName}, command: ${toolCommand}`));

        try {
            return await new Promise<string>((resolve, reject) => {
                let output: string = '';
                let hasStderr = false;
                const child = spawn(toolCommand, {
                    cwd: process.cwd(),
                    env: process.env,
                    shell: true
                });

                child.stdout.on('data', (data) => {
                    if (hasStderr) {
                        hasStderr = false;
                        output += '[/stderr]\n';
                    }

                    output += data;
                });

                child.stderr.on('data', (data) => {
                    if (!hasStderr) {
                        hasStderr = true;
                        output += '[stderr]\n';
                    }

                    output += data;
                });

                child.on('exit', (code) => {
                    output += `[tool exit code: ${code}]\n`;
                    resolve(output);
                });

                child.on('error', (error) => {
                    if (error.message) {
                        output += `[error name: ${error.name}]\n`;
                        output += `[error message: ${error.message}]\n`;
                    }

                    reject(error);
                });

                if (stdinData) {
                    child.stdin.write(stdinData);
                    child.stdin.end();
                }
            });
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            console.error(`Execution failed for tool '${toolName}': ${error.message}`);
            throw error;
        }
    }

    public getAgentTools(agentName: string): unknown[] {
        return [...(this.privateTools.get(agentName)?.values() || [])];
    }

    public getAllGlobalTools(): unknown[] {
        return [...this.globalTools.values()];
    }

    public async initialize() {
        const globalToolsDirs = await this.helpService.findAiFoldersInNodeModules('node_modules', 'ai/tools');
        globalToolsDirs.push(path.resolve('ai/tools'));

        for(const globalToolsDir of globalToolsDirs) {
            // eslint-disable-next-line no-await-in-loop
            await this.watcherService.registerWatcher({
                directory: path.join(globalToolsDir, '*.yaml'),
                onAdd: (filePath) => this.handleFileChange(filePath, this.globalTools),
                onChange: (filePath) => this.handleFileChange(filePath, this.globalTools),
                onReady: () => ux.log(`Loaded and started monitoring global tools files in: ${globalToolsDir}`)
            });
        }
    }

    public async loadAgentTools(agentName: string, agentDir: string) {
        const toolsDir = path.join(agentDir, 'tools');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const agentToolsMap = new Map<string, any>();
        this.privateTools.set(agentName, agentToolsMap);

        await this.watcherService.registerWatcher({
            directory: path.join(toolsDir, '*.yaml'),
            onAdd: (filePath) => this.handleFileChange(filePath, agentToolsMap),
            onChange: (filePath) => this.handleFileChange(filePath, agentToolsMap),
            onReady: () => ux.log(`Loaded and started monitoring tools for agent ${agentName} in: ${toolsDir}`)
        });
    }

    public parseCallAndStartToolExecution(toolCall: string, fromAgent?: string): PendingToolCall {
        const toolBlockMatch = toolCall.match(/```tool\n([\S\s]*?)\n```/im);
        if (!toolBlockMatch) {
            throw new Error('Tool block not found in tool call.');
        }

        const toolBlock = toolBlockMatch[1];
        const nameMatch = toolBlock.match(/#\s*(.*?)\s*(?=\n|$)/);
        const argsMatch = toolBlock.match(/##\s*args:\s*\n(.*?)(?=\n##|$)/s);
        const stdinMatch = toolBlock.match(/##\s*stdin:\s*\n([\S\s]*)$/im);

        const name = nameMatch && nameMatch[1].trim();
        const args = argsMatch && argsMatch[1].trim().split(/\s+/);
        const stdin = stdinMatch && stdinMatch[1];

        if (!name) {
            throw new Error('Tool name not found in tool call.');
        }

        return {
            args,
            name,
            output: this.executeTool(name, args, fromAgent, stdin??''),
            stdin
        };
    }

    public async processTools(pendingToolCalls: Array<PendingToolCall>, filePath: string): Promise<Array<ToolCall>> {
        const ret = [];
        const outputPromises = pendingToolCalls.map(async (tool) => tool.output);
        const outputs = await Promise.all(outputPromises);
        for (const [i, tool] of pendingToolCalls.entries()) {
            // eslint-disable-next-line no-await-in-loop
            const toolOutputFilename = await this.generateToolOutputFilename(filePath, tool.name);
            // eslint-disable-next-line no-await-in-loop
            await this.saveToolOutputToFile(outputs[i], toolOutputFilename.filePath);

            const header = `# Tool ${tool.name}\nHere is the output of the tool you called, please check if it `+
                `completed successfully and try to fix it if it didn't.\n`;
            const chatMessage = `${header}---\n${outputs[i]}\n---\n`;
            const fileMessage = `\n\n---\n${header}[Tool ${tool.name} output](${toolOutputFilename.shortPath})\n\n---\n`;

            // eslint-disable-next-line no-await-in-loop
            await fs.appendFile(filePath, fileMessage);

            console.log(ux.colorize('green', `\nTool ${tool.name} output dumped to file: ${toolOutputFilename}`));
            process.stdout.write(fileMessage);
            ret.push({
                ...tool,
                chatMessage,
                output: outputs[i],
            });
        }

        return ret;
    }

    private async generateToolOutputFilename(chatFile: string, toolName: string): Promise<{
        directory: string
        fileName: string;
        filePath: string;
        shortPath: string;
    }> {
        let directory = path.dirname(chatFile);
        if (directory.startsWith(process.cwd())) {
            directory = directory.slice(process.cwd().length + 1);
        }

        const resourcesDir = path.join(directory, 'resources');
        try {
            await fs.access(resourcesDir);
        } catch {
            await fs.mkdir(resourcesDir, { recursive: true });
        }

        const timestamp = Date.now();

        return {
            directory: resourcesDir,
            fileName: `${toolName}-${timestamp}.txt`,
            filePath: path.join(resourcesDir, `${toolName}-${timestamp}.txt`),
            shortPath: path.join('resources', `${toolName}-${timestamp}.txt`)
        };
    }


    private async handleFileChange(filePath: string, toolsMap: Map<string, any>) {
        await this.loadYamlFile(filePath, toolsMap);
    }

    private async loadYamlFile(filePath: string, toolsMap: Map<string, any>): Promise<void> {
        const toolName = path.basename(filePath, '.yaml');
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const toolConfig:any = yaml.load(fileContent);
            toolConfig.name = toolName;
            toolsMap.set(toolName, toolConfig);
            ux.log(`Loaded tool: ${toolName} from ${filePath}`);
        } catch (error) {
            console.error(`Error parsing YAML file at ${filePath}: ${error}`);
        }
    }

    private async saveToolOutputToFile(toolOutput: string, filePath: string) {
        await fs.writeFile(filePath, toolOutput, 'utf8');
    }
}