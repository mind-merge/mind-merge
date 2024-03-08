import { Service } from "typedi";

import { OpenAIModel } from '../model';
import { IModel } from "../model/model";

@Service()
export class ModelService {
    private models: Map<string, IModel> = new Map();

    async getModel(modelName: string):Promise<IModel> {
        if (!this.models.get(modelName)) {
            switch (modelName) {
                case 'gpt4': {
                    this.models.set(modelName, new OpenAIModel(modelName, 8192));
                    break;
                }

                case 'gpt4-preview': {
                    this.models.set(modelName, new OpenAIModel(modelName, 128_000));
                    break;
                }

                case 'gpt-4-turbo-preview': {
                    this.models.set(modelName, new OpenAIModel(modelName, 128_000));
                    break;
                }

                case 'gpt-3.5-turbo': {
                    this.models.set(modelName, new OpenAIModel(modelName, 16_385));
                    break;
                }

                default: {
                    throw new Error('Unsupported model name');
                }
            }
        }
        
        return this.models.get(modelName) as IModel;
    }
}