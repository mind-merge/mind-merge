import { OpenAIModel } from '../model';
import { Service } from "typedi";

@Service()
export class ModelService {
    private models: any = {};

    async getModel(modelName: string) {
        if (!this.models[modelName]) {
            switch (modelName) {
                case 'gpt4':
                case 'gpt4-preview':
                case 'gpt-4-turbo-preview':
                case 'gpt-3.5-turbo':
                    this.models[modelName] = new OpenAIModel(modelName);
                    break;
                default:
                    throw new Error('Unsupported model name');
            }
        }
        return this.models[modelName];
    }
}