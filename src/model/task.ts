export class Task {
    agentName: string;
    chatFilePath: string;
    description: string;
    expectedOutcome: string;
    fileReferences: string[] = [];
    id: number;
    parentChatFilePath: string;
    status: 'completed' | 'pending';
    title: string;

    constructor(id:number, title: string, description: string, expectedOutcome: string, fileReferences: string[],
                agentName: string, chatFilePath: string, parentChatFilePath: string) {
        this.id = id;
        this.title = title;
        this.agentName = agentName;
        this.description = description;
        this.expectedOutcome = expectedOutcome;
        this.status = 'pending';
        this.chatFilePath = chatFilePath;
        this.parentChatFilePath = parentChatFilePath;
        this.fileReferences = fileReferences;
    }
}