import { OpenAiAPIService } from './openai-api.service';
import { Service } from "typedi";

interface Message {
    role: string;
    content: string;
}

interface Model {
    completeChatRequest(messages: Message[], options?: any): Promise<any>;
}

@Service()
export class ModelService {
    private models: any = {};

    async getModel(modelName: string): Promise<Model | null> {
        if (!this.models[modelName]) {
            switch (modelName) {
                case 'gpt4':
                case 'gpt4-preview':
                case 'gpt-4-turbo-preview':
                case 'gpt-3.5-turbo':
                    this.models[modelName] = new OpenAIModel(modelName, new OpenAiAPIService());
                    break;
                default:
                    throw new Error('Unsupported model name');
            }
        }
        return this.models[modelName];
    }
}

class OpenAIModel implements Model {
    private modelName: string;

    constructor(
        modelName: string,
        private openAiAPIService: OpenAiAPIService
    ) {
        this.modelName = modelName;
    }

    async completeChatRequest(messages: Message[], options: any = null) {
        return await this.openAiAPIService.createChat(messages, this.modelName, options);
    }
}