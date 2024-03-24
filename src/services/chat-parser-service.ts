import {ux} from "@oclif/core";
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Service } from "typedi";

import { Chat, Message, ReferencedFile, Role } from '../model';
import { AgentService } from './agent-service';

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
        private agentsService: AgentService,
    ) { }

    async parseChatFile(filePath: string):Promise<Chat | undefined> {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // Get the base dir of the chat file and generate the path to the resources directory
        const baseDir = path.dirname(filePath);
        
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
            const toolOutputFiles: Array<{content: string, fileName: string, tool:string}> = [];

            if (lines[0].startsWith('# Agent')) {
                role = Role.ASSISTANT;
                messageText = lines.slice(1).join('\n');
            } else if (lines[0].startsWith('# User')) {
                messageText = lines.slice(1).join('\n');
            } else if (lines[0].startsWith('# Tool')) {
                role = Role.USER;
                // Check if the tool output files are specified in the message
                // the tool output files are referenced by the file name in Markdown link format
                // [Tool ${tool.name} output](${toolOutputFilename})
                messageText = lines.slice(1).join('\n');
                const toolOutputFilesMatch = chunk.matchAll(/\[Tool ([^\]]+) output]\(([^)]+)\)/g);
                if (toolOutputFilesMatch) {
                    // map toolOutputFilesMatch to an array of objects with toolName and file name
                    for (const match of toolOutputFilesMatch) {
                        toolOutputFiles.push({content: '', fileName: match[2], tool: match[1]});
                    }

                    // Load contents of files and replace the Markdown link with the file content
                    for (const tool of toolOutputFiles) {
                        const toolOutputFileContent = fs.readFileSync(baseDir+'/'+tool.fileName, 'utf8');
                        tool.content = toolOutputFileContent;
                        messageText = messageText.replace(`[Tool ${tool.tool} output](${tool.fileName})`, `---\n${toolOutputFileContent}\n---\n`);
                    }
                }
            }  else {
                messageText = lines.join('\n');
            }

            messages.push(new Message(role, messageText.trim(), new Date(createdAt), toolOutputFiles));
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

        return new Chat(filePath, agent, messages, referencedFiles, data.parentChatFile, data);
    }

    private async loadReferencedFiles(referencedFiles: string[]): Promise<Array<ReferencedFile>> {
        // eslint-disable-next-line unicorn/no-array-reduce
        return referencedFiles.reduce((acc: ReferencedFile[], file: string) => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                const ext = path.extname(file);
                const markdownFormat = this.extToMarkdown[ext] || 'text';
                acc.push(new ReferencedFile(file, content, ext, markdownFormat));
            } else {
                ux.logToStderr(ux.colorize('red', `File ${file} not found, it will be skipped`));
            }

            return acc;
        }, []);
    }
}