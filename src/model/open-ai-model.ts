// import {encodeChat, isWithinTokenLimit} from "gpt-tokenizer";
// eslint-disable-next-line import/no-named-as-default
import OpenAI from 'openai';
import {ChatCompletionChunk, ChatCompletionMessageParam} from "openai/resources";
import {Stream} from "openai/streaming";
import {appConstant} from "../constants";
import { Message, IModel } from "./index";

let openAI: OpenAI | null = null;

export class OpenAIModel implements IModel {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private modelName: string,
        private maxInputTokens: number = 4096,
        private maxOutputTokens: number = 4096
    ) { 
        if (!appConstant.OPENAI_API_KEY) {
            console.error('OpenAi api key is not set.');
            return;
        }
        openAI = new OpenAI({ apiKey: appConstant.OPENAI_API_KEY });
    }

    async completeChatRequest(messages: Message[]): Promise<Stream<ChatCompletionChunk>> {
        if(messages.length === 0) throw new Error('The request must contain at least one message');

        return openAI!.chat.completions.create({
            max_tokens: this.maxOutputTokens,
            messages: messages.map((message) => ({
                content: message.content,
                role: message.role
            } as ChatCompletionMessageParam)),
            model: this.modelName,
            stream: true,
        });
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