import {Message} from "./message";

export interface IModel {
    // TODO: Return typed response
    // TODO: Add options type
    completeChatRequest(messages: Message[], options?: any): Promise<any>;
}