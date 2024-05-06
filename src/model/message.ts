export enum Role {
    ASSISTANT = "assistant",
    FUNCTION = "function",
    Model = "model",  //gemini
    SYSTEM = "system",
    TOOL = "tool",
    USER = "user",
}

export class Message {
    content: string;
    date: Date;
    role: Role;
    toolOutputFiles: Array<{content: string, fileName: string, tool:string}>;

    constructor(role: Role, message: string, date: Date, toolOutputFiles: Array<{content: string, fileName: string, tool:string}> = []) {
        this.role = role;
        this.content = message;
        this.date = date;
        this.toolOutputFiles = toolOutputFiles;
    }
}