export enum Role {
    ASSISTANT = "assistant",
    FUNCTION = "function",
    SYSTEM = "system",
    TOOL = "tool",
    USER = "user",
}

export class Message {
    content: string;
    date: Date;
    role: Role;

    constructor(role: Role, message: string, date: Date) {
        this.role = role;
        this.content = message;
        this.date = date;
    }
}