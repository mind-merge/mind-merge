import { ChatCompletionMessageParam } from "openai/resources";

export interface IModel {
    modelName: string;
    maxInputTokens: number;
    maxOutputTokens: number;
    completeChatRequest(messages: ChatCompletionMessageParam[], options?:unknown): Promise<unknown>;
}