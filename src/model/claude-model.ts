import Anthropic from '@anthropic-ai/sdk';
import { appConstant } from "../constants";
import { MessageParam } from '@anthropic-ai/sdk/resources';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
import { Message, Role, IModel } from './index';

let client: Anthropic | null = null;

export class ClaudeModel implements IModel {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private modelName: string,
        private maxOutputTokens: number = 1024
    ) {
        if (!appConstant.CLAUDE_API_KEY) {
            console.error('Claude api key is not set.');
            return;
        }
        client = new Anthropic({ apiKey: appConstant.CLAUDE_API_KEY });
    }

    async chatRequestFormat(messages: Message[]) {
        const msgHistory: Message[] = [];
        let sysMsg: string = '';

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];

            if (message.role === Role.SYSTEM) {
                sysMsg += message.content;
                continue;
            }
            msgHistory.push({ ...message, role: message.role });
        }
        return { message: sysMsg, msgHistory };
    }

    async completeChatRequest(messages: Message[]): Promise<MessageStream> {
        if (messages.length === 0) throw new Error('The request must contain at least one message');
        try {
            const { message, msgHistory } = await this.chatRequestFormat(messages);
            return client!.messages.stream({
                system: message,
                messages: msgHistory.map((message) => ({
                    content: message.content,
                    role: message.role
                } as MessageParam)),
                model: this.modelName,
                max_tokens: this.maxOutputTokens,
            });
        } catch (error) {
            throw new Error(`Error completing chat request with Claude: ${error}`);
        }
    }
}