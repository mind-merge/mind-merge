export enum Role {
    SYSTEM = "system",
    USER = "user",
    ASSISTANT = "assistant",
}

export class Message {
    role: Role;
    message: string;
    date: Date;

    constructor(role: Role, message: string, date: Date) {
        this.role = role;
        this.message = message;
        this.date = date;
    }
}