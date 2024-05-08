import {ux} from "@oclif/core";
import * as fs from 'node:fs';
import * as path from 'node:path';
import {Service} from "typedi";

import {Chat, Task} from "../model";

// eslint-disable-next-line new-cap
@Service()
export class TaskService {
    private lastTaskId: number = 0;
    // Assuming tasks are stored in-memory for this example, but this could be adapted to use a database
    private tasks: Task[] = [];

    parseCallAndStartTaskExecution(taskCall: string, parentChatFile:string): Task | null {
        // Preprocessing step to remove the "```task\n" and "```" start and end strings if they are present
        taskCall = taskCall.replace(/^```task\n/, '').replace(/```$/, '');

        // Regular expressions for parsing the task call
        const titleRegex = /# (.+)/;
        const agentRegex = /## Agent: (.+)/;
        const descriptionRegex = /## Description\n([\S\s]+)\n\n## Expected Outcome/;
        const outcomeRegex = /## Expected Outcome\n([\S\s]+)(\n\n## File References)?/;
        const fileReferencesRegex = /## File References\n([\S\s]*)/;

        const titleMatch = taskCall.match(titleRegex);
        const agentMatch = taskCall.match(agentRegex);
        const descriptionMatch = taskCall.match(descriptionRegex);
        const outcomeMatch = taskCall.match(outcomeRegex);
        const fileReferencesMatch = taskCall.match(fileReferencesRegex);

        if (!titleMatch || !agentMatch || !descriptionMatch || !outcomeMatch) {
            ux.logToStderr(ux.colorize('red', `Error: Could not parse the following task call format:\n`)+taskCall);
            return null;
        }

        // Extracted information
        const title = titleMatch[1];
        const agentName = agentMatch[1];
        const description = descriptionMatch[1].trim();
        const expectedOutcome = outcomeMatch[1].trim();
        const fileReferences = fileReferencesMatch ? fileReferencesMatch[1]
            .split('\n')
            .filter(Boolean)
            .map(line => line.replace(/^\s*-\s*/, '').trim()) : [];

        // Determine the parent directory based on the agent's name
        // This might need adjustments based on your application's directory structure
        const parentChatDir = path.dirname(parentChatFile)

        const id = this.lastTaskId++;
        // Generate file path for the task chat
        const chatFilePath = this.generateChatFilePath(parentChatDir, id, title, agentName);

        // Create and return a new Task instance
        const newTask = new Task(id, title, description, expectedOutcome, fileReferences, agentName, chatFilePath, parentChatFile);
        this.tasks.push(newTask);
        this.writeChatFile(newTask);

        return newTask;
    }

    parseTaskOutputBlock(chat:Chat, taskOutput: string) {
        // Preprocessing step to remove the "```task\n" and "```" start and end strings if they are present
        taskOutput = taskOutput.replace(/^```task-output\n/, '').replace(/```$/, '');

        if (!chat.parentChatFile) {
            ux.logToStderr(ux.colorize('red', `Task output found in chat without parent chat file: ${taskOutput}`));
            return
        }

        const taskOutputFile = chat.parentChatFile;
        const taskOutputMessage= `The task output for ${chat.fileName} is listed below, please check it and see what the next steps are:\n${taskOutput}\n---\n`;
        fs.appendFileSync(taskOutputFile, taskOutputMessage);
    }

    private generateChatFilePath(parentChatDir:string, id:number, title: string, agentName: string): string {
        // Implementation details to generate unique file path for chat goes here
        const sanitizedTitle = `${id}-${agentName.replaceAll(/[^\da-z]/gi, '-').toLowerCase()}_${title.replaceAll(/[^\da-z]/gi, '-').toLowerCase()}-${Date.now()}.md`;
        return path.join(parentChatDir, sanitizedTitle);
    }

    private writeChatFile(task: Task): void {

        let parentChatFileRelative = task.parentChatFilePath;
        // keep the dir relative to the current working directory
        if (parentChatFileRelative.startsWith(process.cwd())) {
            parentChatFileRelative = parentChatFileRelative.slice(process.cwd().length + 1);
        }

        // Initial content for the task chat file
        const initialContent = `---
createdAt: ${new Date().toISOString()}
agent: ${task.agentName}
status: ${task.status}
parentChatFile: ${parentChatFileRelative}
fileReferences:
${task.fileReferences.map(ref => `  - ${ref}`).join('\n')}
---
# User

You are working on the following task:
# Task: ${task.title}
### Description
${task.description}

### Expected Outcome
${task.expectedOutcome}

When you finish the task You should generate a message that looks like this:
\`\`\`task-output
# Result
Describe the result of the task here and any additional information was requested by or is relevant for the user or agent
who created the task.
\`\`\`

---
`;

        // Write the initial content to the filesystem
        try {
            fs.writeFileSync(task.chatFilePath, initialContent);
        } catch {
            ux.logToStderr(ux.colorize('red', `Error: Could not write to the following chat file: ${task.chatFilePath}`));
            // Handle file write error (e.g., log or throw)
        }
    }
}