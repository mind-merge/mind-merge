import {binding, given} from "cucumber-tsflow";

@binding()
export class AgentSteps {
    @given(/^I have an agent named "([^"]*)"$/)
    public async iHaveAnAgentNamed(agentName: string) {
        console.log(`Creating agent: ${agentName}`);
    }
}