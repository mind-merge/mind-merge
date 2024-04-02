// import {encodeChat, isWithinTokenLimit} from "gpt-tokenizer";
// import {ChatMessage} from "gpt-tokenizer/esm/GptEncoding";
// eslint-disable-next-line import/no-named-as-default
import OpenAI from 'openai';
import {Chat, ChatCompletionChunk, ChatCompletionMessageParam} from "openai/resources";
import {Stream} from "openai/streaming";

import {appConstant} from "../constants";
import {ChatCompletionRequest, IModel} from "./model";

import ChatCompletionCreateParamsStreaming = Chat.ChatCompletionCreateParamsStreaming;

const openAI = new OpenAI({
    apiKey: appConstant.OPENAI_API_KEY
});

export class OpenAIModel implements IModel {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private modelName: string,
        private maxInputTokens: number = 4096,
        private maxOutputTokens: number = 4096
    ) {
    }

    async completeChatRequest(request:ChatCompletionRequest): Promise<Stream<ChatCompletionChunk>> {
        if (request.messages.length === 0) {
            throw new Error('The request must contain at least one message');
        }

        const openAAIRequest: ChatCompletionCreateParamsStreaming = {
            ...request,
            // eslint-disable-next-line camelcase
            max_tokens: this.maxOutputTokens,
            messages: request.messages.map((message) => ({
                    content: message.content,
                    role: message.role
                } as ChatCompletionMessageParam)),
            model: this.modelName,
            stream: true
            
        };

        // noinspection TypeScriptValidateJSTypes
        return openAI.chat.completions.create(openAAIRequest);
    }

    // Calculate the total tokens for the chat request using gpt-tokenizer
    // async getTotalTokensForChatRequest(request: ChatCompletionRequest): Promise<number> {
    //     // Transform messages into the format required by encodeChat
    //     // Keeping the structure similar to the given encodeChat example
    //     const chat = request.messages.map(message => ({
    //         content: message.content,
    //         role: message.role.toLowerCase() // assuming 'role' matches 'system', 'assistant', etc.
    //     } as ChatMessage));
    //
    //     // Encode the chat into tokens with gpt-tokenizer
    //     const tokens = encodeChat(chat)
    //
    //     // Return the length of the token array as the total token count
    //     return tokens.length;
    // }
    //
    // // Check if the request is within the token limit using gpt-tokenizer
    // isRequestWithinTokenLimit(request: ChatCompletionRequest): boolean {
    //     const messages = request.messages.map(message => ({
    //         content: message.content,
    //         role: message.role.toLowerCase() // assuming 'role' matches 'system', 'assistant', etc.
    //     } as ChatMessage));
    //
    //     // Check if within token limit using isWithinTokenLimit from gpt-tokenizer
    //     // isWithinTokenLimit returns false if over the limit, or the token count if under.
    //     const isWithinLimit = isWithinTokenLimit(messages, this.maxInputTokens);
    //
    //     return Boolean(isWithinLimit); // Convert to boolean
    // }
}