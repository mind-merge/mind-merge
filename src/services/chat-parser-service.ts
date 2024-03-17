import {ux} from "@oclif/core";
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Service } from "typedi";

import { Chat, Message, ReferencedFile, Role } from '../model';
import { AgentsService } from './agents-service';

import matter = require("gray-matter");

// eslint-disable-next-line new-cap
@Service()
export class ChatParserService {

    private extToMarkdown: { [key: string]: string } = {
        '.c': 'c',
        '.cpp': 'cpp',
        '.css': 'css',
        '.dockerfile': 'dockerfile',
        '.go': 'go',
        '.groovy': 'groovy',
        '.html': 'html',
        '.java': 'java',
        '.js': 'javascript',
        '.json': 'json',
        '.kt': 'kotlin',
        '.lua': 'lua',
        '.m': 'matlab',
        '.md': 'markdown',
        '.php': 'php',
        '.pl': 'perl',
        '.py': 'python',
        '.rb': 'ruby',
        '.rs': 'rust',
        '.scala': 'scala',
        '.sh': 'bash',
        '.sql': 'sql',
        '.swift': 'swift',
        '.ts': 'typescript',
        '.txt': 'text',
        '.xml': 'xml',
        '.yaml': 'yaml',
        '.yml': 'yaml'
    };

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private agentsService: AgentsService,
    ) { }

    async parseChatFile(filePath: string):Promise<Chat | undefined> {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        let { content, data } = matter(fileContent);

        data = data ?? {};

        const agentName = data.agent ?? 'main';
        const createdAt = data.createdAt || null;

        const chunks = content.split('\n---\n').map(chunk => chunk.trim());

        const messages: Message[] = [];

        for (const chunk of chunks) {
            if (chunk.length === 0) continue;
            const lines = chunk.split('\n');
            let role: Role = Role.USER; // Default role is User
            let messageText = '';

            if (lines[0].startsWith('# Agent')) {
                role = Role.ASSISTANT;
                messageText = lines.slice(1).join('\n');
            } else if (lines[0].startsWith('# User')) {
                messageText = lines.slice(1).join('\n');
            } else if (lines[0].startsWith('# Tool')) {
                role = Role.USER;
                messageText = lines.slice(1).join('\n');
            }  else {
                messageText = lines.join('\n');
            }

            messages.push(new Message(role, messageText.trim(), new Date(createdAt)));
        }

        const agent = await this.agentsService.getAgent(agentName);

        let referencedFiles:ReferencedFile[] = [];
        if (data.referencedFiles) {
            referencedFiles = await this.loadReferencedFiles(data.referencedFiles);
        }
        
        if (!agent) {
            // log error that the agent dose not exists
            ux.logToStderr(`Agent ${agent} not found, chat could not be loaded`);
            return;
        }

        return new Chat(agent, messages, referencedFiles);
    }

    private async loadReferencedFiles(referencedFiles: string[]): Promise<Array<ReferencedFile>> {
        return referencedFiles.map((file: string) => {
            const content = fs.readFileSync(file, 'utf8');
            const ext = path.extname(file);
            const markdownFormat = this.extToMarkdown[ext] || 'text';

            return new ReferencedFile(file, content, ext, markdownFormat);
        });
    }
}