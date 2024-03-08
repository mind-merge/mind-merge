export class Agent {
    baseDir: string;
    description: string;
    format: string;
    inputData?: string;
    model?: string; // TODO: change to Model instance
    name: string;
    outputData?: string;
    prompt: string;
    temperature?: number;
    max_tokens?: number; // TODO: move to Model

    // eslint-disable-next-line max-params
    constructor(name: string, baseDir: string, format:string, description: string, prompt: string, model?: string, inputData?: string, outputData?: string,  temperature?: number, max_tokens?: number) {
        this.name = name;
        this.baseDir = baseDir;
        this.format = format;
        this.description = description;
        this.prompt = prompt;
        this.model = model;
        this.inputData = inputData;
        this.outputData = outputData;
        this.temperature = temperature;
        this.max_tokens = max_tokens;
    }
}