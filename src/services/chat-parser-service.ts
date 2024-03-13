import * as matter from 'gray-matter';
import * as fs from 'node:fs';
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
        let { content, data } = matter(fileContent);
        if(!data || !data.agent){
            data.agent = 'main';
        }

        const agentName = data.agent || null;
        const createdAt = data.createdAt || null;

        content = content.replace(/\n---\n/g, '\n');
        let pattern = /# (User|Agent)\n([\s\S]*?)(?=# (User|Agent)|$)/g;
        let matches = [...content.matchAll(pattern)];
        const messages: Message[] = [];

        for(const match of matches){
            let role: Role = match[1] == 'User' ? Role.USER : Role.ASSISTANT; // Default role is User
            let messageText = match[2].trim();
            messages.push(new Message(role, new Date(createdAt), messageText));
        }
        const agent: Agent = await this.agentsService.getAgent(agentName);

        if (agent) {
            return new Chat(agent, messages);
        }
    }
}