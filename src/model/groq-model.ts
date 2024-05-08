import Groq from "groq-sdk";
import { appConstant } from "../constants";
import { Message, IModel } from "./index";

let groq: Groq | null = null;

export class GroqModel implements IModel {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private modelName: string,
        private maxOutputTokens: number = 4096
    ) {
        if (!appConstant.GROQ_API_KEY) {
            console.error('Groq api key is not set.');
            return;
        }
        groq = new Groq({ apiKey: appConstant.GROQ_API_KEY });
    }

    async completeChatRequest(messages: Message[]) {
        if (messages.length === 0) throw new Error('The request must contain at least one message');
        return groq!.chat.completions.create({
            max_tokens: this.maxOutputTokens,
            messages: messages.map((message) => ({
                content: message.content,
                role: message.role
            })),
            model: this.modelName,
            stream: true,
        });
    }
}