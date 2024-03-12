export class Message {
    date?: Date;
    message?: string;
    role: Role;

    constructor(role: Role, date?: Date, message?: string) {
        this.role = role;
        this.date = date;
        this.message = message;
    }
}

export enum Role {
    ASSISTANT = "assistant",
    SYSTEM = "system",
    USER = "user",
}