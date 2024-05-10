import { Service } from "typedi";
import { GeminiModel, OpenAIModel, ClaudeModel, GroqModel, IModel, Provider } from '../model';

@Service()
export class ModelService {
    private models: Map<string, IModel> = new Map();

    async getModel(provider: Provider, modelName: string): Promise<IModel> {
        if (!this.models.get(modelName)) {

            switch (provider) {
                case Provider.OpenAI: {
                    this.models.set(modelName, new OpenAIModel(modelName));
                    break;
                }

                case Provider.Google: {
                    this.models.set(modelName, new GeminiModel(modelName));
                    break;
                }

                case Provider.Anthropic: {
                    this.models.set(modelName, new ClaudeModel(modelName));
                    break;
                }

                case Provider.Groq: {
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