import {Command, Flags, ux} from '@oclif/core';
import * as fs from "node:fs";
import * as path from "node:path";

export class NewCommand extends Command {
    static description = 'Starts a new chat session';

    static examples = [
        '<%= config.bin %> <%= command.id %> --user=john --feature=chat',
        '<%= config.bin %> <%= command.id %> --user=jane --feature=search --agent=bot',
    ];

    static flags = {
        agent: Flags.string({char: 'a', default: 'main', description: 'name of the agent the chat is with', required: false}),
        feature: Flags.string({char: 'f', description: 'name of the feature the chat is about', required: true}),
        user: Flags.string({char: 'u', description: 'name of the user the chat is for', required: true}),
    };

    async run() {
        const {flags} = await this.parse(NewCommand);

        this.log(ux.colorize('green', `Starting chat for user: ${flags.user} about feature: ${flags.feature}`));
        if (flags.agent) {
            this.log(ux.colorize('blue', `The chat is with agent: ${flags.agent}`));
        } else {
            this.log(ux.colorize('blue', 'The chat will use the main agent.'));
        }

        // Check if the ai/chats directory exists, if not error out
        const dirName = path.join(process.cwd(), 'ai/chats');
        if (!await this.directoryExists(dirName)) {
            this.error('You must run this command from the project root directory(ie. where the ai directory is located)');
        }

        const sanitizedFeatureName = this.sanitizeFeatureName(flags.feature);

        // check if the user directory exists, if not create it
        const userDir = path.join(dirName, flags.user);
        if (!await this.directoryExists(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        // check if the feature directory exists, if not create it
        const featureDir = path.join(userDir, sanitizedFeatureName);
        if (!await this.directoryExists(featureDir)) {
            fs.mkdirSync(featureDir, { recursive: true });
        }

        // create the chat file in the feature directory
        const chatFilePath = path.join(featureDir, `${sanitizedFeatureName}.md`);
        const chatFileContent = this.generateChatFileContent(flags.agent);

        // write the content to the file
        fs.writeFileSync(chatFilePath, chatFileContent);

        // log the file path to the console
        this.log(`Chat file created at: ${chatFilePath}`);
    }

    private async directoryExists(dirPath: string): Promise<boolean> {
        try {
            const stats = fs.statSync(dirPath);
            return stats.isDirectory();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error:any) {
            if (error.code === 'ENOENT') {
                return false;
            }

            throw error;
        }
    }

    private generateChatFileContent(agentName = 'main'): string {
        return `---
createdAt: ${new Date().toISOString()}
agent: ${agentName}
---
# User
`;
    }

    private sanitizeFeatureName(featureName: string): string {
        return featureName.toLowerCase().replaceAll(/[^\da-z]/g, '-');
    }
}