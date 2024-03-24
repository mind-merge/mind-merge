import {Agent, Message} from "./";
import {ReferencedFile} from "./referenced-file";

export class Chat {
    agent: Agent;
    data: object = {};
    fileName: string;
    messages: Message[];
    parentChatFile: null | string = null;
    referencedFiles: ReferencedFile[] = [];

    constructor(fileName: string, agent: Agent, messages: Message[], referencedFiles: ReferencedFile[] = [], parentChatFile:null | string = null, data: object = {}) {
        this.fileName = fileName;
        this.agent = agent;
        this.messages = messages;
        this.referencedFiles = referencedFiles;
        this.parentChatFile = parentChatFile;
        this.data = data;
    }
}