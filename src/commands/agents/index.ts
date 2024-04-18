import { Command, Flags, ux } from '@oclif/core';
import * as fs from 'node:fs';
import * as path from 'node:path';

export class NewAgent extends Command {
    static description = 'Creates a new agent with a specified name';

    static examples = [
        `$ mind-merge agent:new --agent-name=myAgent`,
    ];

    static flags = {
        agentName: Flags.string({
            aliases: ['agent-name'],
            char: 'n',
            description: 'name of the agent',
            helpLabel: '-n --agent-name',
            required: true
        }),
    };

    async directoryExists(dirPath: string): Promise<boolean> {
        try {
            const stats = fs.statSync(dirPath);
            return stats.isDirectory();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return false;
            }

            throw error;
        }
    }

    async run() {
        const { flags } = await this.parse(NewAgent);

        const {agentName} = flags;

        // Check if the ai/chats directory exists, if not error out
        const dirName = path.join(process.cwd(), 'ai/prompts/agents');
        if (!await this.directoryExists(dirName)) {
            this.error('You must run this command from the project root directory(ie. where the ai directory is located)');
        }

        const agentDirPath = path.join(dirName, agentName);
        const agentFilePath = path.join(agentDirPath, `${agentName}.md.liquid`);

        try {
            // check if the agent directory exists, if not create it
            if (!await this.directoryExists(agentDirPath)) {
                fs.mkdirSync(agentDirPath, { recursive: true });
            }

            // Create agent file with default content
            const defaultContent = `---\nname: ${agentName}\nmodel: gpt-4-turbo-preview\n---\nYou are an agent that helps the user with his request.`

            // write the content to the file
            fs.writeFileSync(agentFilePath, defaultContent);

            this.log(ux.colorize('green', `Agent '${agentName}' has been created successfully at ${agentFilePath}.`));
        } catch (error) {
            console.error('An error occurred while creating the agent:', error)
        }
    }
}