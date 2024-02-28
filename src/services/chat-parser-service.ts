import * as fs from 'node:fs';
import * as matter from 'gray-matter';
const _ = require('lodash');
import { Service } from "typedi";
import { Agent, Chat, Message, Role } from '../model';

@Service()
export class ChatParserService {

    parseChatFile(filePath: string): Chat {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        const agentName = data.agent || null;
        const createdAt = data.createdAt || null;

        const chunks = content.split('\n---\n').map(chunk => chunk.trim());

        const messages: Message[] = [];

        chunks.forEach(chunk => {

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
        });

        const agent = new Agent(agentName, '', '', '', '', '', '', '');
        const chat = new Chat(agent, messages, '');

        return chat;
    }
}