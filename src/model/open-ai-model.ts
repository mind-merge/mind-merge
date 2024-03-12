import OpenAI from 'openai';

import {appConstant} from "../constants";
import {IModel} from "./model";

const openAI = new OpenAI({
    apiKey: appConstant.OPENAI_API_KEY
});

export class OpenAIModel implements IModel {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        public modelName: string,
        public maxInputTokens: number = 4096,
        public maxOutputTokens: number = 4096
    ) { }

    async completeChatRequest(messages: OpenAI.ChatCompletionMessageParam[], options: unknown = null) {
        if (!messages) throw new Error('The model cannot process enough tokens to complete the request');

        const tokens = messages
            .map((message: OpenAI.ChatCompletionMessageParam | any) => message.content ? message.content.split(' ').length : 0)
            .reduce((total, words) => total + words, 0);

        if (tokens > this.maxInputTokens) {
            // TODO: Add the number of tokens that the model can process
            throw new Error('The model cannot process enough tokens to complete the request');
        }
        // Check if the model can process enough tokens to complete the request
        
        return openAI.chat.completions.create({
            max_tokens: this.maxOutputTokens,
            messages,
            model: this.modelName,
            stream: true,
            temperature: 1,
        });
    }
}