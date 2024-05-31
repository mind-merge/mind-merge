import { Given, When, Then } from '@cucumber/cucumber';
import { AgentService } from '../src/services/agent-service';
import { ToolService } from '../src/services/tool-service';
import { HelpService } from '../src/services/help-service';
const helpService = new HelpService();
const toolsService = new ToolService(helpService);
let agentService = new AgentService(toolsService, helpService);

Given('the agent service is initialized', async () => {
    await agentService.initialize();
});

When(/^the agent service loads an agent named (.*) and filepath (.*)$/, async (agent: string, filePath: string) => {
    await agentService.loadAgent(filePath, agent);
});

Then(/^the agent named (.*) should be loaded correctly/, async (agentName: string) => {
    let agent = await agentService.getAgent(agentName);
    if (!agent) throw Error('agent is not loaded')
});
