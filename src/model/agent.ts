import { IModel, Message, Role } from "./index";
export class Agent {
    baseDir: string;
    description: string;
    format: string;
    inputData?: string;
    model: IModel;
    name: string;
    outputData?: string;
    prompt: string;

    // eslint-disable-next-line max-params
    constructor(name: string, baseDir: string, format: string, description: string, prompt: string, model: IModel, inputData?: string, outputData?: string) {
        this.name = name;
        this.baseDir = baseDir;
        this.format = format;
        this.description = description;
        this.prompt = prompt;
        this.model = model;
        this.inputData = inputData;
        this.outputData = outputData;
    }

    prepareChatForModel(): Message[] {
        const messages: Message[] = [];
        const systemPrompt = `name: ${this.name}, description: ${this.description}, inputData: ${this.inputData}, outputData: ${this.outputData}, ${this.prompt}`;
        messages.push({ content: systemPrompt, role: Role.SYSTEM });
        return messages as Message[];
    }
}