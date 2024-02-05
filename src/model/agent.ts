export class Agent {
    baseDir: string;
    description: string;
    format: string;
    inputData?: string;
    model?: string;
    name: string;
    outputData?: string;
    prompt: string;

    // eslint-disable-next-line max-params
    constructor(name: string, baseDir: string, format:string, description: string, prompt: string, model?: string, inputData?: string, outputData?: string) {
        this.name = name;
        this.baseDir = baseDir;
        this.format = format;
        this.description = description;
        this.prompt = prompt;
        this.model = model;
        this.inputData = inputData;
        this.outputData = outputData;
    }
}