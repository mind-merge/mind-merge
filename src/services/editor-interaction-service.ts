import {ux} from "@oclif/core";
import {spawn} from "node:child_process";
import {Service} from "typedi";

import {GlobalFlagsService} from "./global-flags-service";

// eslint-disable-next-line new-cap
@Service()
export class EditorInteractionService
{

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private globalFlagsService: GlobalFlagsService
    ) {
    }

    openChatFileInEditor(filePath: string) {
        if (this.globalFlagsService.getFlag('webstorm')) {
            const command = this.globalFlagsService.getFlag('webstormPath') || 'webstorm';
            this.executeCommand(`"${command}" "${filePath}"`).then((output) => {
                console.log(output);
            }).catch((error) => {
                console.error(error);
            });
            ux.log(ux.colorize('green', `Opened file in WebStorm: ${command} --args "${filePath}"`));
        }
    }

    private async executeCommand(command:string) {
        try {
            return await new Promise<string>((resolve, reject) => {
                let output: string = '';
                let hasStderr = false;
                const child = spawn(command, {
                    cwd: process.cwd(),
                    env: process.env,
                    shell: "/bin/bash"
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

            });
        } catch (error) {
            // @ts-expect-error don't care about the error type
            console.error(`Execution failed for tool '${toolName}': ${error.message}`);
            throw error; // Rethrow to allow higher-level handling if needed
        }
    }

}