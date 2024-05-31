import { Given, When, Then } from '@cucumber/cucumber';
import { Provider, IModel } from '../src/model';
import { ModelService } from '../src/services/model-service';

let modelService: ModelService;
let setModelName: string;
let setProvider: Provider;

Given('the ModelService has no models in cache', () => {
    modelService = new ModelService();
});

When(/^I request a model for (.*) provider with name (.*)$/, async (provider: Provider, modelName: string) => {
    setProvider = provider;
    setModelName = modelName;
});

Then(/^the service should return a model (.*)$/, async (model) => {
    if(!setModelName == model){
        throw Error('Unsupported provider name');
    }
});
