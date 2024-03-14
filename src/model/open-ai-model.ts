import OpenAI from 'openai';
import { encodeChat, } from 'gpt-tokenizer';

import { appConstant } from "../constants";
import { IModel, Message, Role } from "./index";

const openAI = new OpenAI({
    apiKey: appConstant.OPENAI_API_KEY
});
interface ChatMessage {
    role: Role;
    content: string;
}

export class OpenAIModel implements IModel {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        public modelName: string,
        public maxInputTokens: number = 4096,
        public maxOutputTokens: number = 4096
    ) { }

    async completeChatRequest(messages: Message[], options: unknown = null) {
        if (!messages) throw new Error('The model cannot process enough tokens to complete the request');

        //for temp
        const tokens: number = 5000 || await this.calculateToken(messages);

        if (tokens > this.maxInputTokens) {
            // TODO: Add the number of tokens that the model can process
            throw new Error('The model cannot process enough tokens to complete the request');
        }
        // Check if the model can process enough tokens to complete the request
        const chatList = messages.map((message) => {
            return {
                role: message.role as Role,
                content: message.content,
            } as ChatMessage;
        });
        return openAI.chat.completions.create({
            max_tokens: this.maxOutputTokens,
            messages: chatList,
            model: this.modelName,
            stream: true,
            temperature: 1,
        });
    }

    //not working
    async calculateToken(messages: Message[]) {
        let tokens: number[] = encodeChat(messages as (Message & { content: string })[]);
        return tokens.length;
    }
}