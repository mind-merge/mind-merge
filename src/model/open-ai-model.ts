import OpenAI from 'openai';

import {appConstant} from "../constants";
import {IModel} from "./model";

const openAI = new OpenAI({
    apiKey: appConstant.OPENAI_API_KEY
});

export class OpenAIModel implements IModel {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private modelName: string,
        private maxInputTokens: number = 4096,
        private maxOutputTokens: number = 4096
    ) {}

    async completeChatRequest(messages: any, options: any = null) {
        if (!messages) return false;
        
        const tokens = 400; // TODO: Calculate the tokens based on the messages
        if (tokens > this.maxInputTokens) {
            // TODO: Add the number of tokens that the model can process
            throw new Error('The model cannot process enough tokens to complete the request');
            return false;
        }
        // Check if the model can process enough tokens to complete the request
        
        return openAI.chat.completions.create({
            max_tokens: this.maxOutputTokens,
            messages,
            model: this.modelName,
            stream: true,
            temperature: options ? options.temperature : 1,
        });
    }
}