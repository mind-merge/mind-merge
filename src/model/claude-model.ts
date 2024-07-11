import Anthropic from '@anthropic-ai/sdk';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
import { MessageParam } from '@anthropic-ai/sdk/resources';

import { appConstant } from "../constants";
import { IModel, Message, Role } from './index';

let client: Anthropic | null = null;

export class ClaudeModel implements IModel {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private modelName: string,
        private maxOutputTokens: number = 4096
    ) {
        if (!appConstant.CLAUDE_API_KEY) {
            console.error('Claude api key is not set.');
            return;
        }
        
        client = new Anthropic({ apiKey: appConstant.CLAUDE_API_KEY });
    }

    /**
     * To prepare the messages for Anthropic API we need to:
     * - go through the messages array and extract the system prompt as a separate string
     * - the for each message do this:
     * - messages with role TOOL or FUNCTION get converted to role USER and the logic below for role user applies for them too
     * - if we have 2 or more messages in a row with role USER the content of all of them gets concatenated with a double new line
     * - if we have 2 or more messages in a row with role ASSISTANT the content of all of them gets concatenated with a double new line
     * - messages with role ASSISTANT should get trimmed for any whitespace at the beginning or end
     *
     * @param messages the messages array to be formatted
     * @returns the formatted messages
     */
    async chatRequestFormat(messages: Message[]) {
        let sysMsg: string = '';
        const msgHistory: Message[] = [];

        for (const message of messages) {

            if (message.role === Role.SYSTEM) {
                sysMsg += message.content + "\n";
                continue;
            }

            let currentRole = message.role;
            if (currentRole === Role.TOOL || currentRole === Role.FUNCTION) {
                currentRole = Role.USER;
            }

            let {content} = message;
            if (currentRole === Role.ASSISTANT) {
                content = content.trim();
            }

            const lastMessage = msgHistory.at(-1);

            if (lastMessage && lastMessage.role === currentRole) {
                lastMessage.content += "\n\n" + content;
            } else {
                msgHistory.push({ ...message, content, role: currentRole });
            }
        }

        return { message: sysMsg.trim(), msgHistory };
    }

    async completeChatRequest(messages: Message[]): Promise<MessageStream> {
        if (messages.length === 0) throw new Error('The request must contain at least one message');
        try {
            const { message, msgHistory } = await this.chatRequestFormat(messages);
            return client!.messages.stream({
                // eslint-disable-next-line camelcase
                max_tokens: this.maxOutputTokens,
                messages: msgHistory.map((message) => ({
                    content: message.content,
                    role: message.role
                } as MessageParam)),
                model: this.modelName,
                system: message,
            });
        } catch (error) {
            throw new Error(`Error completing chat request with Claude: ${error}`);
        }
    }
}