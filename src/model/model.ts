import {Message} from "./message";

export interface IModel {
    completeChatRequest(messages: Message[]): Promise<unknown>;
}