import { Service } from "typedi";
import OpenAI from 'openai';
const _ = require('lodash');
import { appConstant } from "../constants";

const openai = new OpenAI({
    apiKey: appConstant.OPENAI_API_KEY
});

@Service()
export class OpenAiAPIService {

    async createChat(content: any, model: string, options: any) {
        if (!content) return false;
        const result = await openai.chat.completions.create({
            messages: content,
            model,
            stream: true,
            max_tokens: options ? options.max_tokens : 256,
            temperature: options ? options.temperature : 1,
        });

        let completeResponse: any = '';
        for await (const chunk of result) {
            for (const choice of chunk.choices) {
                if (choice.delta && choice.delta.content) {
                    completeResponse += choice.delta.content;
                }
            }
        }
        return completeResponse;
    }
}