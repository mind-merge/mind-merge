import {Agent, Message} from "./";
import {ReferencedFile} from "./referenced-file";

export class Chat {
    fileName: string;
    agent: Agent;
    messages: Message[];
    referencedFiles: ReferencedFile[] = [];

    constructor(fileName: string, agent: Agent, messages: Message[], referencedFiles: ReferencedFile[] = []) {
        this.fileName = fileName;
        this.agent = agent;
        this.messages = messages;
        this.referencedFiles = referencedFiles;
    }
}