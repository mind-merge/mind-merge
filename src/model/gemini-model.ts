import { GoogleGenerativeAI } from '@google/generative-ai';
import { appConstant } from "../constants";
import { Message, Role } from './index';
import { IModel } from './model';

const genAI = new GoogleGenerativeAI(appConstant.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });    // use static model here for now


export class GeminiModel implements IModel {

    // eslint-disable-next-line no-useless-constructor
    constructor(
        private modelName: string,
    ) { }

    async chatRequestFormat(messages: Message[]) {
        let prevRole = Role.USER;
        const msgHistory: Message[] = [];
        let message;

        for (let i = 0; i < messages.length; i++) {
            message = messages[i];

            if (i < messages.length - 1) {
                // concat system n user message
                if ((prevRole === Role.SYSTEM || prevRole === Role.USER) && message.role === Role.USER) {
                    const prevMessage = msgHistory.pop();
                    const concatenatedContent: string = (prevMessage?.content ?? '') + message.content;
                    msgHistory.push({ ...message, role: Role.USER, content: concatenatedContent });
                } else {
                    msgHistory.push({ ...message, role: message.role === Role.ASSISTANT ? Role.Model : message.role });
                }
                prevRole = message.role;
            }
        }
        return { message, msgHistory }
    }

    async completeChatRequest(messages: Message[]) {
        try {
            const { message, msgHistory } = await this.chatRequestFormat(messages);
            const chat = model.startChat({
                history: msgHistory.map(message => ({
                    parts: [{ text: message.content }],
                    role: message.role,
                })),
            });

            const result = await chat.sendMessageStream(message ? message.content : '');
            return result.stream;
        } catch (error) {
            throw new Error(`Error completing chat request with Gemini: ${error}`);
        }
    }
}