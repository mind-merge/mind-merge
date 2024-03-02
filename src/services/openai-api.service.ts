import { Service } from "typedi";
import OpenAI from 'openai';
import { appConstant } from "../constants";
import * as fs from 'node:fs';
import { ux } from "@oclif/core";

const openai = new OpenAI({
    apiKey: appConstant.OPENAI_API_KEY
});

@Service()
export class OpenAiAPIService {

    async createChat(content: any, model: string, options: any = null) {
        if (!content) return false;
        const result = await openai.chat.completions.create({
            messages: content,
            model,
            stream: true,
            max_tokens: options ? options.max_tokens : 256,
            temperature: options ? options.temperature : 1,
        });

        if(result){
            fs.appendFileSync(options.filePath, '# Agent\n\n');
            for await (const chunk of result) {
                for (const choice of chunk.choices) {
                    if (choice.delta && choice.delta.content) {
                        const deltaContent = choice.delta.content;
                        fs.appendFileSync(options.filePath, deltaContent);
                        process.stdout.write(deltaContent.toString());
                    }
                }
            }
            fs.appendFileSync(options.filePath, '\n\n# User\n\n');
            console.log(ux.colorize('green', `\nAppended answer to file: ${options.filePath}`));
        }
    }
}