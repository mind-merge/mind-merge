import OpenAI from 'openai';
import { appConstant } from "../constants";

const openai = new OpenAI({
    apiKey: appConstant.OPENAI_API_KEY
});

interface Message {
    role: string;
    content: string;
}

interface Model {
    completeChatRequest(messages: Message[], options?: any): Promise<any>;
}

export class OpenAIModel implements Model {
    private modelName: string;

    constructor(
        modelName: string,
    ) {
        this.modelName = modelName;
    }

    async completeChatRequest(messages: any, options: any = null) {
        if (!messages) return false;
        return await openai.chat.completions.create({
            messages,
            model: this.modelName,
            stream: true,
            max_tokens: options ? options.max_tokens : 256,
            temperature: options ? options.temperature : 1,
        });
    }
}