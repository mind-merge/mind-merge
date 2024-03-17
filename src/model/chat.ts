import {Agent, Message} from "./";
import {ReferencedFile} from "./referenced-file";

export class Chat {
    agent: Agent;
    messages: Message[];
    referencedFiles: ReferencedFile[] = [];

    constructor(agent: Agent, messages: Message[], referencedFiles: ReferencedFile[] = []) {
        this.agent = agent;
        this.messages = messages;
        this.referencedFiles = referencedFiles;
    }
}