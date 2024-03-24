---
referencedFiles:
  - src/services/chat-execution-service.ts
  - src/services/agent-service.ts
  - src/model/chat.ts
  - src/model/agent.ts
  - src/model/task.ts
  - src/services/task-service.ts
---
# User

We are working on a new feature that will allow multiple agents to interact with each other. 
This feature will allow agents to communicate with each other and share information. 
This will enable agents to work together to solve complex problems.

Agents execute tasks, we will have a new service that manages tasks and uses agents to execute them.
A task is defined by a title, an agent, a detailed description, and an expected outcome.
The task will be executed by the agent and the result will be stored in the task.
When the task is completed, the agent will notify the task service and the task will be marked as completed.
When a task is completed, the agent that created the task will get executed and the result of the task will be sent to the agent for it to review.
Each task will have it's own chat file where the communication with the agent will happen and all the history and the result of the task will be stored.

Let's first define the structure of what we need to add and where.
Just like the tools get executed we should have a pattern for agents to add tasks to the task queue.
Each chat with an agent will generate a new file with the conversation and the agent's responses, in the same folder as the rest of the chat.
We should reuse the same chat execution service and logic for the agent requests too, let's verify and see if we need to make it more generic.

Be technical, go into details of how we should implement this feature.

---
# Agent

To implement the feature that allows multiple agents to interact with each other, solve complex problems, and manage tasks, we will follow a multi-step plan. This plan includes creating a new service for task management, modifying existing services for generic handling of tasks and agent interactions, and ensuring that agents can create, communicate about, and complete tasks.

### Plan Overview

1. **Define Task Model**
2. **Create Task Service**
3. **Modify ChatExecutionService for Task Handling**
4. **Integrate Task Management with AgentsService**
5. **File Naming and Storage Convention**
6. **Agent Task Invocation Pattern**
7. **Task Completion and Notification**

### Step-by-Step Instructions

#### 1. Define Task Model
First, define a TypeScript class for tasks. Each task must include a title, agent responsible, detailed description, expected outcome, status, and a reference to its chat file.

```typescript
// File: src/model/task.ts
export class Task {
    id: number;  // Unique identifier for the task
    title: string;
    agentName: string;  // Name of the agent responsible for the task
    description: string;
    expectedOutcome: string;
    status: 'pending' | 'completed';
    chatFilePath: string;  // File path for the task-specific chat

    constructor(title: string, agentName: string, description: string,
                expectedOutcome: string, chatFilePath: string) {
        this.title = title;
        this.agentName = agentName;
        this.description = description;
        this.expectedOutcome = expectedOutcome;
        this.status = 'pending';
        this.chatFilePath = chatFilePath;
    }
}
```

#### 2. Create Task Service
Create a new service to manage tasks. This service will be responsible for task creation, execution, and completion notifications.

```typescript
// File: src/services/task-service.ts
import {Service} from "typedi";
import {Task} from "../model/task";
import {AgentsService} from "./agents-service";
import {ChatExecutionService} from "./chat-execution-service";
import * as fs from 'node:fs';
import * as path from 'node:path';

@Service()
export class TaskService {
    // Assuming tasks are stored in-memory for this example, but this could be adapted to use a database
    private tasks: Task[] = [];

    constructor(private agentsService: AgentsService, private chatExecutionService: ChatExecutionService) {}

    async createTask(title: string, agentName: string, description: string, expectedOutcome: string): Promise<Task> {
        const chatFilePath = this.generateChatFilePath(title, agentName);
        const task = new Task(title, agentName, description, expectedOutcome, chatFilePath);
        this.tasks.push(task);
        return task;
    }

    private generateChatFilePath(title: string, agentName: string): string {
        // Implementation details to generate unique file path for chat goes here
        const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return path.join(__dirname, `../../ai/chats/tasks/${agentName}/${sanitizedTitle}-${Date.now()}.md`);
    }

    // Other methods for task execution, completion, etc.
}
```

#### 3. Modify ChatExecutionService for Task Handling
Refactor `ChatExecutionService` to make it generic enough to handle both agent interactions and task execution. This may involve parameterizing the agent's chat file path and ensuring the service can handle task-specific logic.

#### 4. Integrate Task Management with AgentsService
Enhance the `AgentsService` to support invoking tasks. When an agent specifies a task (using a predefined syntax in chat files), the `AgentsService` should delegate to the `TaskService` to create and manage the task.

#### 5. File Naming and Storage Convention
Establish a file naming and storage convention for tasks and their chats. Task chats could be stored in a directory structure similar to `ai/chats/{userName}/{featureName}/{taskId}-{taskTitle}-{timestamp}.md` to keep them organized and accessible.

#### 6. Agent Task Invocation Pattern
Define a pattern for agents to add tasks to the queue. This could be a special syntax or command recognized by the `ChatParserService` or directly within agent markdown files.

#### 7. Task Completion and Notification
Ensure that upon task completion, the responsible agent is notified and provided with the task result. This could involve appending the result to the task's chat file and possibly invoking the agent again to review the result.

### Assumptions
- The system uses in-memory storage for tasks. For production use, integrating a database is recommended.
- Task execution logic integration with agents and the completion mechanism will be expanded upon based on the specific interactions required.

### Tools Used
- TypeScript for developing models and services.
- Typedi for dependency injection.
- The OCLif framework for any CLI interactions.
- Node.js file system module for file operations.

**Next Steps:** Upon agreement with this plan, the detailed implementation for each step will be outlined, including modifications to existing services and files.

---
# User

Feedback:
> The system uses in-memory storage for tasks. For production use, integrating a database is recommended.

This is not the case, we are storing all the data in the filesystem in the chat files, the chat files will be used to restore the state of the conversation and the task.

Tasks will be stored in the subfolder tasks of each chat folder, the chat file will be used to store the conversation and the task details. Ex: `ai/chats/mincua/feat-name/tasks/task1.md`
Those files will need to be parsed and loaded as chats.

---
# Agent

Given the feedback and the requirement to store task data in the filesystem within specific chat file directories, we'll need to adjust our approach accordingly. Our revised plan will focus on utilizing the filesystem for storage and retrieval of task information embodied within chat files, and parsing those chat files to restore the state of conversations and tasks.

### Revised Plan Overview

1. **Refine File Naming and Storage for Tasks**
2. **Adjust Task Service to Utilize Filesystem for Task Storage**
3. **Modify ChatExecutionService to Support Task Chat Parsing and Execution**
4. **Establish Task Creation and Notification Pattern for Agents**
5. **Implement Task Parsing and State Restoration**

### Step-by-Step Instructions

#### 1. Refine File Naming and Storage for Tasks
Task-related chats will be stored under a specific path format within the project's directory structure. Each task chat file will follow the pattern: `ai/chats/{userName}/{featureName}/tasks/{taskTitle}.md`. This convention ensures task chats are organized and manageable.

#### 2. Adjust Task Service to Utilize Filesystem for Task Storage
The `TaskService` needs to be adjusted to create task-specific chat files based on the outlined storage convention and use these files for storing task-related conversations and details.

```typescript
// Adjustments to TaskService for filesystem-based task storage
async createTask(title: string, agentName: string, description: string, expectedOutcome: string, parentChatDir: string): Promise<string> {
    const chatFilePath = this.generateChatFilePath(title, agentName, parentChatDir);
    const taskChatContent = this.generateInitialChatContent(title, agentName, description, expectedOutcome);
    fs.writeFileSync(chatFilePath, taskChatContent);
    return chatFilePath;
}

private generateChatFilePath(title: string, agentName: string, parentChatDir: string): string {
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return path.join(parentChatDir, `tasks/${sanitizedTitle}.md`);
}

private generateInitialChatContent(title: string, agentName: string, description: string, expectedOutcome: string): string {
    // Generate the initial content of the task chat file with task details
    return `# Task: ${title}\nAgent: ${agentName}\n\n### Description\n${description}\n\n### Expected Outcome\n${expectedOutcome}\n\n---\n`;
}
```

#### 3. Modify ChatExecutionService to Support Task Chat Parsing and Execution
Ensure `ChatExecutionService` can parse and handle chat files located within the tasks subdirectory, adapting its logic to recognize and execute tasks described within those chats.

#### 4. Establish Task Creation and Notification Pattern for Agents
Define how agents can request task creation through chat file interactions, and detail how agents will be notified within chat files upon task completion.

#### 5. Implement Task Parsing and State Restoration
Implement logic to parse task-specific chat files during application startup or on-demand to restore state. This involves identifying chat files in task subdirectories and loading their content to instantiate `Task` objects or equivalent representations in memory for active management.

### Assumptions Adjusted
- All task and conversation states are maintained in chat files within a structured directory hierarchy, eliminating the need for in-memory or database storage.
- The application is responsible for thoroughly parsing these files to recover states accurately.

### Tools Used
- The implementation will primarily use TypeScript for programming logic adjustments.
- Node.js file system module for file read and write operations.
- Possibly leveraging existing Oclif commands for handling CLI interactions related to tasks.

**Next Steps:** The next steps involve implementing the outlined adjustments to the `TaskService` and `ChatExecutionService`, and defining clear interfaces for tasks within the chat system. Feedback or further instructions on proceeding with these steps would be appreciated.

---
# User

I updated and refactored the code, please refer to the referenced files for the changes made.

we need to implement the `parseCallAndStartTaskExecution`, the taskCall string has the following format:
```task
# Task Title
## Agent: AgentName

## Description
Task description

## Expected Outcome
Task expected outcome
```

The string inside the blockquote is extracted by the chat-execution-service and passed to the task-service to create a new task.

---
# Agent

Given the format for a task creation request as described, the `parseCallAndStartTaskExecution` function in the `TaskService` will need to:

1. Parse the provided `taskCall` string to extract the task's title, the responsible agent's name, description, and expected outcome.
2. Create a new task chat file with the extracted information in the appropriate directory structure.
3. Return a `Task` object (or `null` if the task creation fails due to any reason).

Let's implement this in the `TaskService` class.

### Implementation Plan for `parseCallAndStartTaskExecution`

1. **Parse the taskCall String**: Use regular expressions to extract the task title, agent name, description, and expected outcome from the `taskCall` string.
2. **Create the Task Chat File**: Based on the parsed information, generate the path and initial content for the new task chat file, and write it to the filesystem.
3. **Task Object Creation**: Create and return a new `Task` instance with the extracted and generated information.

### Implementation Steps

#### Step 1. Update the Task Model to Include a Constructor

If not already present, make sure the `Task` class includes a constructor that initializes all its properties.

#### src/model/task.ts
```typescript
export class Task {
    // Existing properties ...

    constructor(title: string, agentName: string, description: string, expectedOutcome: string, chatFilePath: string) {
        // Initialize properties
    }
}
```

#### Step 2. Implement `parseCallAndStartTaskExecution`

Here's how `parseCallAndStartTaskExecution` function implementation could look:

#### src/services/task-service.ts
```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';

parseCallAndStartTaskExecution(taskCall: string): Task | null {
    // Regular expressions for parsing the task call
    const titleRegex = /# (.+)/;
    const agentRegex = /## Agent: (.+)/;
    const descriptionRegex = /## Description\n([\s\S]+)\n\n## Expected Outcome/;
    const outcomeRegex = /## Expected Outcome\n([\s\S]+)/;

    const titleMatch = taskCall.match(titleRegex);
    const agentMatch = taskCall.match(agentRegex);
    const descriptionMatch = taskCall.match(descriptionRegex);
    const outcomeMatch = taskCall.match(outcomeRegex);

    if (!titleMatch || !agentMatch || !descriptionMatch || !outcomeMatch) {
        // Log error or handle as necessary
        return null;
    }

    // Extracted information
    const title = titleMatch[1];
    const agentName = agentMatch[1];
    const description = descriptionMatch[1].trim();
    const expectedOutcome = outcomeMatch[1].trim();

    // Determine the parent directory based on the agent's name 
    // This might need adjustments based on your application's directory structure
    const parentChatDir = path.join(__dirname, `../../ai/chats/${agentName}`);

    // Generate file path for the task chat
    const chatFilePath = this.generateChatFilePath(title, agentName, parentChatDir);

    // Initial content for the task chat file
    const initialContent = `# Task: ${title}\nAgent: ${agentName}\n\n### Description\n${description}\n\n### Expected Outcome\n${expectedOutcome}\n\n---\n`;

    // Write the initial content to the filesystem
    try {
        fs.writeFileSync(chatFilePath, initialContent);
    } catch (error) {
        // Handle file write error (e.g., log or throw)
        return null;
    }

    // Create and return a new Task instance
    const newTask = new Task(title, agentName, description, expectedOutcome, chatFilePath);
    this.tasks.push(newTask);  // Assuming `tasks` array exists for storing Task instances
    return newTask;
}

private generateChatFilePath(title: string, agentName: string, parentChatDir: string): string {
    // Same as previously described generateChatFilePath method
}
```

### Notes
- The error handling here is minimal for clarity; consider more robust error handling and logging as required.
- The exact directory structure for storing task chats (`parentChatDir`) might need adjustments based on your application's specifics.
- Ensure that the `Task` model and other related methods like `generateChatFilePath` are correctly aligned with these changes.

With this implementation, `ChatExecutionService` can pass a parsed task creation request string to `TaskService`, which will then handle the creation of a new task and its chat file accordingly.

---
# User
