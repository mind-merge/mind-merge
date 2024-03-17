---
referencedFiles:
  - src/services/chat-execution-service.ts
  - src/services/agents-service.ts
  - src/services/model-service.ts
  - src/model/model.ts
  - src/model/open-ai-model.ts
  - src/model/chat.ts
  - src/model/agent.ts
  - src/services/tools-service.ts
---
# User

We'll be working on adding the tool usage feature for the agents.

We'll add a new service called `ToolsService` that will be responsible for managing the tools and their execution.
The `ToolsService` will be responsible for:
    - Managing and loading all the global tools
    - Managing and loading all the private tools - expose an API for the `AgentService` to use

`AgentService` will be responsible for:
    - Managing and loading all the agents
    - Managing and loading all the private tools for each agent using the `ToolsService`

The `ChatExecutionService` class will support the execution of tools:
- The `ChatExecutionService` class will ask the `ToolsService` for instances of all the global defined active tools
- The `ChatExecutionService` class will get the description of all private tools that were provided by the `AgentService`
- The `ChatExecutionService` class will set the description of both global and private tools as a variable in the liquid templating engine
- `executeChatRequest(Chat chat)`:
    - When the reply starts streaming back it's the responsibility of the `ChatExecutionService` class to do the following 2 things with it:
        - Send it to the `Chat` instance so it gets appended to disk in the chat file
        - Once a reply from the model has ended the `ChatExecutionService` class should parse it and extract the following:
            - Tool calls (ex: patterns starting with `%%%TOOL` and ending in `%%%END-TOOL`)
    - A model can call multiple tools in the same reply and will receive the output from all of them in the next request. Tool requests will get executed in parallel.
    - If a tool request is made by the model the `ChatExecutionService` class will call the `ToolsService` with the request, wait for the output from all tool requests and compose a new reply that will also be appended to the chat file.
    - Once the output from all tools is ready the `ChatExecutionService` class will create a new message containing the output of each tool and the tool name for each one then add that to the `Chat` instance, these messages will be sent to the model with ROLE_USER but will be appended to the chat file with a `# External Tool/Agent Output` header.

---
# Agent

To implement the described functionalities, we'll proceed with the following development steps:

### 1. Define `ToolsService` class

This service will handle global and private tools' operations. It involves loading, executing tools, and keeping track of available tools.

#### src/services/tools-service.ts
```typescript
import { Service } from "typedi";
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execProm = util.promisify(exec);

@Service()
export class ToolsService {
    private globalTools: Map<string, any> = new Map();
    private privateTools: Map<string, Map<string, any>> = new Map();

    constructor() {
        this.loadGlobalTools();
    }

    private loadGlobalTools() {
        const toolsDir = path.resolve('ai/tools');
        const toolFiles = fs.readdirSync(toolsDir);

        toolFiles.forEach((file) => {
            if (file.endsWith('.yaml')) {
                const toolName = file.replace('.yaml', '');
                const toolConfig = fs.readFileSync(path.join(toolsDir, file), 'utf8');
                this.globalTools.set(toolName, toolConfig);
            }
        });
    }

    public async executeTool(toolName: string, args: string[]): Promise<string> {
        const toolPath = this.getToolPath(toolName);
        if (!toolPath) {
            throw new Error(`Tool '${toolName}' not found.`);
        }

        const { stdout, stderr } = await execProm(`"${toolPath}" ${args.join(' ')}`);

        if (stderr) {
            throw new Error(stderr);
        }

        return stdout;
    }

    private getToolPath(toolName: string): string | null {
        // This function should be extended to cover the logic for finding the tool script
        // based on the toolName from either globalTools or specific agent's privateTools.
        return null;
    }

    // Add more helper methods for managing privateTools as needed
}
```

### 2. Update `AgentsService` to manage private tools for each agent

This involves updating the `loadAgent` method to identify and load private tools for each agent, utilizing `ToolsService`.

### 3. Incorporate tool execution in `ChatExecutionService`

This class will now also manage tool execution requests, parse tool call syntax from model replies, and handle tool output.

#### Part of src/services/chat-execution-service.ts
```typescript
// Add the following imports at the top
import { ToolsService } from './tools-service';

// Update the class constructor to inject ToolsService
constructor(
    // Existing parameters
    private toolsService: ToolsService
) { }

// Include tool execution logic within executeChatRequest or a similar method
private async executeToolCalls(chat: Chat, toolCalls: Array<{toolName: string; args: string[]}>): Promise<void> {
    const toolOutputs = await Promise.all(toolCalls.map(({ toolName, args }) =>
        this.toolsService.executeTool(toolName, args).then(output => ({ toolName, output })).catch(error => ({ toolName, error: error.message }))
    ));

    toolOutputs.forEach(({ toolName, output, error }) => {
        let messageContent = `# External Tool/Agent Output: ${toolName}\n`;
        messageContent += error ? `Error: ${error}` : output;
        chat.messages.push(new Message(Role.USER, messageContent));
    });

    // Append the tool outputs to the chat file
}

// Modify other parts of the class to extract tool calls from model replies,
// execute tools and handle the output appropriately.
```

### 4. Handling Tool Calls Syntax in Replies
For handling the tool call syntax `(%%%TOOL ... %%%END-TOOL)`, implement a method that parses such patterns from the model's text replies. This method would extract the tool name and arguments and pass them for execution as described above.

### Considerations and Next Steps:
- Properly handle liquid template variables for tool descriptions to be usable by the agents.
- Implement error handling and logging appropriately, especially for tool execution failures.
- Extend the `ToolsService.getToolPath` method to correctly locate both global and private tools based on their names, this should involve checking the private tools of the agent first, then falling back to global tools.

By following these steps, we can effectively integrate tool management and execution capabilities into the system, leveraging `ToolsService` for executing both global and agent-specific tools and enhancing the `ChatExecutionService` to support dynamic tool invocation as per model-generated instructions.

---
# User

Let's focus on the ToolsService first, here is the feedback:
- We should parse the yaml data in each file, those will be the tool configurations, those should be stored for each tool.
- We should have a method to return all tools
- We should have a method to parse private tools for an agent from a specific directory
- We should have a method to return all private tools for an agent
- The tool command should be parsed from the yaml file and should be used to execute the tool, the running directory should be the root of the project

---
# Agent

To address the feedback and refine the `ToolsService`, we will focus on enhancing its ability to parse and manage both global and private tool configurations, provide access methods for these tools, and execute tool commands precisely as defined in YAML configurations.

### Updated `ToolsService` Implementation:

```typescript
import { Service } from "typedi";
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import util from 'util';
import * as yaml from 'js-yaml';

const execProm = util.promisify(exec);

@Service()
export class ToolsService {
    private globalTools: Map<string, any> = new Map();
    // Mapping from agent name to a Map of tool names and configurations
    private privateTools: Map<string, Map<string, any>> = new Map();

    constructor() {
        this.loadGlobalTools();
    }

    private loadGlobalTools() {
        const toolsDir = path.resolve('ai/tools');
        const toolFiles = fs.readdirSync(toolsDir);

        toolFiles.forEach((file) => {
            if (file.endsWith('.yaml')) {
                const toolName = file.replace('.yaml', '');
                const toolConfigPath = path.join(toolsDir, file);
                const toolConfig = yaml.load(fs.readFileSync(toolConfigPath, 'utf8'));
                this.globalTools.set(toolName, toolConfig);
            }
        });
    }

    public async executeTool(toolName: string, args: string[], agentName?: string): Promise<string> {
        let toolConfig = this.globalTools.get(toolName);

        if (agentName) {
            toolConfig = this.privateTools.get(agentName)?.get(toolName);
        }

        if (!toolConfig) {
            throw new Error(`Tool '${toolName}' not found.`);
        }

        const toolCommand = toolConfig.command + ' ' + args.join(' ');
        const { stdout, stderr } = await execProm(toolCommand, { cwd: process.cwd() });

        if (stderr) {
            throw new Error(stderr);
        }

        return stdout;
    }

    public getAllGlobalTools(): any[] {
        return Array.from(this.globalTools.values());
    }

    public parseAgentTools(agentName: string, agentDir: string) {
        const toolsDir = path.join(agentDir, 'tools');
        if (!fs.existsSync(toolsDir)) return;

        const toolFiles = fs.readdirSync(toolsDir);
        const agentTools = new Map<string, any>();

        toolFiles.forEach((file) => {
            if (file.endsWith('.yaml')) {
                const toolName = file.replace('.yaml', '');
                const toolConfigPath = path.join(toolsDir, file);
                const toolConfig = yaml.load(fs.readFileSync(toolConfigPath, 'utf8'));
                agentTools.set(toolName, toolConfig);
            }
        });

        this.privateTools.set(agentName, agentTools);
    }

    public getAgentTools(agentName: string): any[] {
        return Array.from(this.privateTools.get(agentName)?.values() || []);
    }
}
```

### Key Updates:

1. **YAML Parsing**: When loading global and private tools, their configurations are now parsed from YAML files using `yaml.load`. This ensures configurations can be easily managed and understood.

2. **Execute Tool with Configuration**: The `executeTool` method now looks up the configuration for the requested tool and uses the `command` specified in the tool's YAML file to execute it. If an `agentName` is provided, it attempts to execute a private tool; otherwise, it defaults to global tools.

3. **Agent Tools Parsing & Management**
   - The `parseAgentTools` method loads private tools for a specified agent from its directory. This enables dynamic loading of agent-specific tools when agents are loaded or updated.
   - The `getAgentTools` method provides access to all parsed private tools for a given agent.

4. **Get All Global Tools**: `getAllGlobalTools` allows retrieval of all global tool configurations, useful for debugging, listing available tools, or integrating into higher-level functionalities.

5. **Execution Command and Working Directory**: When executing a tool's command, this version explicitly sets the working directory (`cwd`) to the root of the project via `process.cwd()`. This ensures that tools execute relative to the project's base directory, aligning with the expectations for tool behavior and file paths.

This updated implementation provides a comprehensive approach for managing, accessing, and executing both global and private tools, leveraging YAML for configuration and ensuring flexibility for future extensions.

---
# User

Make the tool loading a separate function that's reused for both global and private tools, this will help with code reuse and readability. Also, consider adding error handling for tool configuration parsing and execution, ensuring that any issues are logged and reported appropriately.

---
# Agent

To enhance code reuse and improve error handling in the `ToolsService`, we can refactor the tool loading logic into a separate function that is utilized for both global and private tools. Additionally, we'll incorporate better error handling mechanisms to ensure that any issues during tool configuration parsing and execution are logged and reported appropriately.

Here is the refined implementation:

### Refactored `ToolsService` Implementation:

```typescript
import { Service } from "typedi";
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import util from 'util';
import * as yaml from 'js-yaml';

const execProm = util.promisify(exec);

@Service()
export class ToolsService {
    private globalTools: Map<string, any> = new Map();
    private privateTools: Map<string, Map<string, any>> = new Map();

    constructor() {
        const globalToolsDir = path.resolve('ai/tools');
        this.loadToolsFromDirectory(globalToolsDir, this.globalTools);
    }

    private loadToolsFromDirectory(toolsDirectory: string, toolsMap: Map<string, any>) {
        if (!fs.existsSync(toolsDirectory)) {
            console.error(`Tools directory not found: ${toolsDirectory}`);
            return;
        }

        const toolFiles = fs.readdirSync(toolsDirectory).filter(file => file.endsWith('.yaml'));

        toolFiles.forEach((file) => {
            try {
                const toolName = file.replace('.yaml', '');
                const toolConfigPath = path.join(toolsDirectory, file);
                const toolConfig = yaml.load(fs.readFileSync(toolConfigPath, 'utf8'));
                toolsMap.set(toolName, toolConfig);
            } catch (error) {
                console.error(`Error parsing tool configuration for ${file}: ${error}`);
            }
        });
    }

    public async executeTool(toolName: string, args: string[], agentName?: string): Promise<string> {
        let toolConfig = this.globalTools.get(toolName);

        if (agentName) {
            toolConfig = this.privateTools.get(agentName)?.get(toolName);
        }

        if (!toolConfig) {
            throw new Error(`Tool '${toolName}' not found.`);
        }

        const toolCommand = toolConfig.command + ' ' + args.join(' ');

        try {
            const { stdout, stderr } = await execProm(toolCommand, { cwd: process.cwd() });

            if (stderr) {
                throw new Error(`Execution error for tool '${toolName}': ${stderr}`);
            }

            return stdout;
        } catch (error) {
            console.error(`Execution failed for tool '${toolName}': ${error}`);
            throw error; // Rethrow to allow higher-level handling if needed
        }
    }

    public getAllGlobalTools(): any[] {
        return Array.from(this.globalTools.values());
    }

    public parseAgentTools(agentName: string, agentDir: string) {
        const toolsDir = path.join(agentDir, 'tools');
        const agentToolsMap = new Map<string, any>();
        this.loadToolsFromDirectory(toolsDir, agentToolsMap);
        this.privateTools.set(agentName, agentToolsMap);
    }

    public getAgentTools(agentName: string): any[] {
        return Array.from(this.privateTools.get(agentName)?.values() || []);
    }
}
```

### Key Refinements:

1. **Shared Tool Loading Logic**: The `loadToolsFromDirectory` function abstracts the common logic of reading tool configurations from a directory and loading them into a specified map. This function is utilized for loading both global tools and agent-specific private tools, promoting code reuse and simplicity.

2. **Error Handling for Tool Loading**: Errors encountered while parsing tool configurations or if the tools directory is not found are now logged, thereby improving the robustness of the tool loading logic.

3. **Error Handling for Tool Execution**: The `executeTool` method includes try-catch blocks to handle and log errors that may occur during tool execution, including capturing stderr output and throwing errors with descriptive messages. This approach ensures that errors are both reported to the console for visibility and propagated up, allowing for further handling if necessary.

The refactored implementation presents a cleaner structure with enhanced error handling capabilities, ensuring that the service can robustly manage and execute tool operations while providing meaningful feedback on any issues encountered.

---
# User

I have some feedback for the tool execution function, let's fix it, return only that function.

The execution should be async and should capture both stdout and stderr.
The flow of output between stdout and stderr should be captured to a single string, in order. The output that comes from 
stderr should be added to the output with a prefix of "[stderr]" and a newline character. At the end of the output from 
stderr, before a message from stdout starts to get appended we should add a "[/stderr]" string and a newline character

The return code from the process should be captured too, if the return code is not 0 we should add the following string to the output: "[exit code: <exit code>]" and a newline character.

The command should be executed in a bash process so we respect all the env vars like PATH and others, and allow full bash syntax.

---
# Agent

To address the feedback, we need to enhance the `executeTool` function within the `ToolsService` class. This updated implementation ensures that both `stdout` and `stderr` are captured asynchronously and merged into a single output stream, with the content from `stderr` distinctly marked. Additionally, it captures the exit code of the executed command and handles execution within a bash shell to respect environment variables and bash syntax. Here’s the revised `executeTool` function:

```typescript
public async executeTool(toolName: string, args: string[], agentName?: string): Promise<string> {
    let toolConfig = this.globalTools.get(toolName);

    if (agentName) {
        toolConfig = this.privateTools.get(agentName)?.get(toolName);
    }

    if (!toolConfig) {
        throw new Error(`Tool '${toolName}' not found.`);
    }

    const toolCommand = `${toolConfig.command} ${args.join(' ')}`;
    const bashCommand = `bash -c '${toolCommand.replace(/'/g, "'\\''")}'`;

    try {
        const { stdout, stderr, code } = await new Promise((resolve, reject) => {
            let output = '';
            let hadStderr = false;

            const child = exec(bashCommand, { cwd: process.cwd(), shell: true, env: process.env }, (error, stdout, stderr) => {
                if (error) {
                    // Append exit code if process exits with an error
                    output += `[exit code: ${error.code}]\n`;
                    reject(new Error(output));
                } else {
                    resolve({ stdout, stderr, code: 0 });
                }
            });

            child.stdout.on('data', (data) => {
                if (hadStderr) {
                    output += "[/stderr]\n";
                    hadStderr = false;
                }
                output += data;
            });

            child.stderr.on('data', (data) => {
                if (!hadStderr) {
                    output += "[stderr]\n";
                    hadStderr = true;
                }
                output += data;
            });
        });

        return `${stderr ? `[stderr]\n${stderr}[/stderr]\n` : ''}${stdout}${code && code !== 0 ? `[exit code: ${code}]\n` : ''}`;
    } catch (error) {
        console.error(`Execution failed for tool '${toolName}': ${error.message}`);
        throw error; // Rethrow to allow higher-level handling if needed
    }
}
```

### Key Points:

- **Execution in Bash Shell**: The command is executed within a bash shell (`bash -c '<command>'`) to ensure full compatibility with bash syntax and environment variables. Special care is taken to escape single quotes in the command to correctly execute it within bash.
- **Unified Output**: The function captures and merges `stdout` and `stderr` streams. `stderr` messages are explicitly marked with `[stderr]` at the beginning and `[/stderr]` at the end to visually differentiate them in the merged output.
- **Exit Code Handling**: The exit code of the process is checked. If the command exits with a code other than 0, an `[exit code: <exit code>]` message is appended to the output.
- **Async Handling**: Execution is wrapped in a Promise to manage the asynchronous nature of the `exec` function and stream handling, ensuring that the function awaits the completion of the command and captures all output correctly.
- **Error Management**: Errors are caught and logged, with execution-related errors (including non-zero exit codes) leading to the rejection of the promise. This approach ensures that calling functions can handle these errors appropriately.

---
# User

I don't understand this return statement:
```typescript
return `${stderr ? `[stderr]\n${stderr}[/stderr]\n` : ''}${stdout}${code && code !== 0 ? `[exit code: ${code}]\n` : ''}`;
```
If we are gathering the output from both channels in output, why not return just the output?

---
# Agent

You're correct. In the context provided, where the output from both `stdout` and `stderr` is being aggregated into a single `output` variable, and considering the handling is already integrated within the event listeners for `data` on both `stdout` and `stderr`, the return statement should indeed just return this `output` variable. 

This oversight points out a misunderstanding in the separation of concerns within the Promise's resolution and the handling of `stdout` and `stderr`. Given the revised approach where all data (including errors and normal output) is concatenated into one string (`output`), there's no need to differentiate between `stdout` and `stderr` again in the return statement. Additionally, the exit code is also handled within the Promise, appending its information directly to `output` if necessary.

Let's correct and simplify the function to return the `output` directly:

```typescript
public async executeTool(toolName: string, args: string[], agentName?: string): Promise<string> {
    let toolConfig = this.globalTools.get(toolName);
    
    if (agentName) {
        let privateToolConfig = this.privateTools.get(agentName)?.get(toolName);
        if (privateToolConfig) {
            toolConfig = privateToolConfig;
        }
    }
    
    if (!toolConfig) {
        throw new Error(`Tool '${toolName}' not found.`);
    }
    
    const toolCommand = `${toolConfig.command} ${args.join(' ')}`;
    const bashCommand = `bash -c '${toolCommand.replace(/'/g, "'\\''")}'`;

    try {
        const output = await new Promise((resolve, reject) => {
            let output = '';
            const child = exec(bashCommand, { cwd: process.cwd(), shell: true, env: process.env });

            child.stdout.on('data', (data) => {
                if (output !== '' && !output.endsWith('\n')) output += '\n';
                output += data;
            });

            child.stderr.on('data', (data) => {
                if (output !== '' && !output.endsWith('\n')) output += '\n';
                output += '[stderr]\n' + data + '[/stderr]';
            });

            child.on('exit', (code) => {
                if (code !== 0) {
                    output += `[exit code: ${code}]\n`;
                }
                resolve(output);
            });

            child.on('error', (error) => {
                reject(error);
            });
        });

        return output;
    } catch (error) {
        console.error(`Execution failed for tool '${toolName}': ${error.message}`);
        throw error; // Rethrow to allow higher-level handling if needed
    }
}
```

### Key Changes:

1. **Unified Output**: The function now properly accumulates output into a single `output` variable, including differentiating `stderr` content but within the same variable.
2. **Exit Code Handling**: The exit code handling and its appending to the `output` now correctly happens within the `'exit'` event handler.
3. **Error Handling**: The error handling is now more accurately captured through the `'error'` event, ensuring the Promise is rejected with any error encountered during command execution.

This corrected and simplified approach keeps the handling logic consistent and ensures that the final returned string encompasses all the relevant output, including `stdout`, `stderr`, and exit code information, effectively meeting the specified requirements.

---
# User

I updated the version in the tools-service.ts file, please take that version and make it support passing in stdin data.

---
# Agent

To support passing in stdin data to the tool execution in the `ToolsService` class, we'll make a few adjustments to the `executeTool` method. This involves modifying the method signature to accept an optional `stdin` data string and piping this data into the tool's standard input when executing the command.

Here's how you can incorporate the stdin support into the `executeTool` method:

```typescript
public async executeTool(toolName: string, args: string[], agentName?: string, stdinData: string = ""): Promise<string> {
    let toolConfig = this.globalTools.get(toolName);
    
    if (agentName) {
        const privateToolConfig = this.privateTools.get(agentName)?.get(toolName);
        if (privateToolConfig) {
            toolConfig = privateToolConfig;
        }
    }

    if (!toolConfig) {
        throw new Error(`Tool '${toolName}' not found.`);
    }
    
    const toolCommand = `${toolConfig.command} ${args.join(' ')}`;
    const bashCommand = `bash -c '${toolCommand.replace(/'/g, "'\\''")}'`;

    try {
        const output = await new Promise<string>((resolve, reject) => {
            let output = '';
            const child = exec(bashCommand, { cwd: process.cwd(), shell: true, env: process.env });

            child.stdout.on('data', (data) => {
                if (output !== '' && !output.endsWith('\n')) output += '\n';
                output += data;
            });

            child.stderr.on('data', (data) => {
                if (output !== '' && !output.endsWith('\n')) output += '\n';
                output += '[stderr]\n' + data + '[/stderr]';
            });

            child.on('exit', (code) => {
                if (code !== 0) {
                    output += `[exit code: ${code}]\n`;
                }
                resolve(output);
            });

            child.on('error', (error) => {
                reject(error);
            });

            if (stdinData) {
                child.stdin.write(stdinData);
                child.stdin.end();  // Ensure the stdin stream is closed
            }
        });

        return output;
    } catch (error) {
        console.error(`Execution failed for tool '${toolName}': ${error.message}`);
        throw error; // Rethrow to allow higher-level handling if needed
    }
}
```

### Key Updates:

1. **Stdin Support**: The method signature is updated to include an optional `stdinData` parameter. This allows you to pass in a string that will be written to the tool's standard input.

2. **Writing to Stdin**: Inside the Promise, just before entering the event listeners, we check if `stdinData` has been provided. If yes, we write this data to the `child` process's stdin stream and then end the stream. This ensures that the executed tool receives the intended input data.

3. **Command Execution Environment**: The command is still executed within a bash shell, respecting the original requirements regarding environment variables and bash syntax. 

By incorporating these modifications, the `ToolsService` is now capable of executing tools with the option to provide stdin data, enhancing its flexibility for various tool execution scenarios.

---
# User
