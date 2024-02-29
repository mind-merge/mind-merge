import { Service } from "typedi";
import OpenAI from 'openai';
import { appConstant } from "../constants";

const openai = new OpenAI({
    apiKey: appConstant.OPENAI_API_KEY
});

@Service()
export class OpenAiAPIService {

    async createChat(content: any) {
        if (!content) return false;
        const result = await openai.chat.completions.create({
            messages: [{ role: "user", content }],
            model: "gpt-3.5-turbo",
        });

        if (result && result['choices'] && result['choices'].length && result['choices'][0] && result['choices'][0]['message'] && result['choices'][0]['message']['content']) {
            return result['choices'][0]['message']['content'];
        }
    }
}