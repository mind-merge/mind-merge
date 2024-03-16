import { Message } from "./index";

export interface IModel {
    modelName: string;
    maxInputTokens: number;
    maxOutputTokens: number;
    completeChatRequest(messages: Message[], options?:unknown): Promise<unknown>;
    calculateToken(messages: Message[]):Promise<number>;
}