import { Service } from "typedi";

import { GeminiModel, OpenAIModel, ClaudeModel, GroqModel, IModel } from '../model';

@Service()
export class ModelService {
    private models: Map<string, IModel> = new Map();

    async getModel(provider: string, modelName: string): Promise<IModel> {
        if (!this.models.get(modelName)) {

            switch (provider) {
                case 'openai': {
                    this.models.set(modelName, new OpenAIModel(modelName));
                    break;
                }

                case 'google': {
                    this.models.set(modelName, new GeminiModel(modelName));
                    break;
                }

                case 'anthropic': {
                    this.models.set(modelName, new ClaudeModel(modelName));
                    break;
                }

                case 'groq': {
                    this.models.set(modelName, new GroqModel(modelName));
                    break;
                }

                default: {
                    throw new Error('Unsupported provider name');
                }
            }
        }
        return this.models.get(modelName) as IModel;
    }
}