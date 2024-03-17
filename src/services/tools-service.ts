import {ux} from "@oclif/core";
import * as chokidar from "chokidar";
import * as yaml from 'js-yaml';
import {spawn} from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";

// eslint-disable-next-line new-cap
@Service()
export class ToolsService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private globalTools: Map<string, any> = new Map();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private privateTools: Map<string, Map<string, any>> = new Map();
    private watchers: Map<string, chokidar.FSWatcher> = new Map();

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
            // @ts-expect-error don't care about the error type
            console.error(`Execution failed for tool '${toolName}': ${error.message}`);
            throw error; // Rethrow to allow higher-level handling if needed
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getAgentTools(agentName: string): any[] {
        return [...(this.privateTools.get(agentName)?.values() || [])];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getAllGlobalTools(): any[] {
        return [...this.globalTools.values()];
    }

    handleFileChange(filePath: string, toolsMap: Map<string, any>) {
        this.loadYamlFile(filePath, toolsMap);
    }

    public initialize() {
        const globalToolsDir = path.resolve('ai/tools');
        // this.loadToolsFromDirectory(globalToolsDir, this.globalTools);
        this.addWatcher(globalToolsDir, this.globalTools);

        ux.log(`Started monitoring global tools files in: ${globalToolsDir}`)
    }

    public parseAgentTools(agentName: string, agentDir: string) {
        const toolsDir = path.join(agentDir, 'tools');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const agentToolsMap = new Map<string, any>();
        this.privateTools.set(agentName, agentToolsMap);

        if (!this.watchers.has(toolsDir)) {
            this.addWatcher(toolsDir, agentToolsMap);
        }
    }

    parseCallAndStartToolExecution(toolCall: string, fromAgent?: string) {
        // The tool call is expected to be in the following format:
        // ```tool
        // # tool_name
        // ## args:
        // value1
        // ## stdin:
        // Text to send to stdin if necessary
        // ```

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

        // Execute the tool with the parsed name, args, and stdin
        return {
            args,
            name,
            output: this.executeTool(name, args, fromAgent, stdin??''),
            stdin
        };
    }

    private addWatcher(directory: string, toolsMap: Map<string, any>) {
        const watcher = chokidar.watch(path.join(directory, '*.yaml'), { persistent: true });

        watcher
            .on('add', (filePath) => this.handleFileChange(filePath, toolsMap))
            .on('change', (filePath) => this.handleFileChange(filePath, toolsMap));

        this.watchers.set(directory, watcher);
    }

    private loadYamlFile(filePath: string, toolsMap: Map<string, any>): void {
        const toolName = path.basename(filePath, '.yaml');
        try {
            const toolConfig = yaml.load(fs.readFileSync(filePath, 'utf8'));
            // @ts-expect-error don't care about the error type
            toolConfig.name = toolName;
            toolsMap.set(toolName, toolConfig);
        } catch (error) {
            console.error(`Error parsing YAML file at ${filePath}: ${error}`);
        }

        ux.log(`Loaded tool: ${toolName} from ${filePath}`);
    }
}