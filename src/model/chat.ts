import { Agent, Message } from "./";

export class Chat {
    agent: Agent;
    messages: Message[];
    // model: string;

    constructor(agent: Agent, messages: Message[]) {
        this.agent = agent;
        this.messages = messages;
        // this.model = model;
    }
}