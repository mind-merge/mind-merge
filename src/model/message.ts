export class Message {
    // date?: Date;
    content?: string;
    role: Role;

    constructor(role: Role, content?: string) {
        this.role = role;
        // this.date = date;
        this.content = content;
    }
}

export enum Role {
    ASSISTANT = "assistant",
    SYSTEM = "system",
    USER = "user",
}