import { Provider } from "./model";
export class Agent {
    baseDir: string;
    description: string;
    fileName: string;
    format: string;
    inputData?: string;
    model?: string;
    provider?: Provider;
    name: string;
    outputData?: string;
    prompt: string;

    // eslint-disable-next-line max-params
    constructor(name: string, fileName: string, baseDir: string, format: string, description: string, prompt: string, model?: string, provider?: Provider, inputData?: string, outputData?: string) {
        this.name = name;
        this.fileName = fileName;
        this.baseDir = baseDir;
        this.format = format;
        this.description = description;
        this.prompt = prompt;
        this.model = model;
        this.provider = provider;
        this.inputData = inputData;
        this.outputData = outputData;
    }
}