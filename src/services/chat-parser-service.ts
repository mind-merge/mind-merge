import * as fs from 'node:fs';
import * as matter from 'gray-matter';
import { Service } from "typedi";
import { Agent, Chat, Message, Role } from '../model';
import { AgentsService } from './agents-service';

@Service()
export class ChatParserService {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private agentsService: AgentsService,
    ) { }

    async parseChatFile(filePath: string):Promise<Chat | undefined> {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { content, data } = matter(fileContent);
        if(!data || !data.agent){
            data.agent = 'main';
        }

        const agentName = data.agent || null;
        const createdAt = data.createdAt || null;

        const chunks = content.split('\n---\n').map(chunk => chunk.trim());

        const messages: Message[] = [];

        for (const chunk of chunks) {
            const lines = chunk.split('\n');
            let role: Role = Role.USER; // Default role is User
            let messageText = '';

            if (lines[0].startsWith('# Agent')) {
                role = Role.ASSISTANT;
                messageText = lines.slice(1).join('\n');
            } else if (lines[0].startsWith('# User')) {
                messageText = lines.slice(1).join('\n');
            } else {
                messageText = lines.join('\n');
            }

            messages.push(new Message(role, messageText.trim(), new Date(createdAt)));
        }

        const agent = await this.agentsService.getAgent(agentName);

        if (agent) {
            return new Chat(agent, messages);
        }
    }
}