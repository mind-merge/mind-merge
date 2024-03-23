---
referencedFiles:
  - src/services/chat-execution-service.ts
  - src/services/agents-service.ts
  - src/model/chat.ts
  - src/model/agent.ts
---
# User

We are working on a new feature that will allow multiple agents to interact with each other. 
This feature will allow agents to communicate with each other and share information. 
This will enable agents to work together to solve complex problems.

Let's first define the structure of what we need to add and where.
Just like the tools get executed we should also be able to send a request to a new agent.
Each chat with an agent will generate a new file with the conversation and the agent's responses, in the same folder as the rest of the chat.
We should reuse the same chat execution service and logic for the agent requests too, let's verify and see if we need to make it more generic.

Be technical, go into details of how we should implement this feature.

---
# Agent

To implement the capability for multiple agents to interact with each other and share information, let's outline a detailed plan for the structure and modifications needed in the application. This feature will enhance the agents' ability to collaborate on complex tasks by enabling direct communication among them.

### Assumptions
1. Each agent is capable of understanding requests from other agents and can provide responses accordingly.
2. Agents communicate using a standardized format which is already supported by the existing `ChatExecutionService`.
3. The interaction between agents doesn’t require real-time communication; sequential processing of requests and responses is sufficient.

### Overview of Changes
The primary change is enabling agents to send requests to other agents. This process involves:
- Identifying a new "agent request" instruction in the agents' conversation files.
- Processing these requests using the existing `ChatExecutionService`, with modifications to support inter-agent communication.
- Creating new chat files for each agent-agent interaction, ensuring these conversations are logged and stored similarly to user-agent chats.

### Detailed Plan

#### 1. Extending the Chat Model to Support Agent Requests
- Update the `Message` model to include a new property `targetAgent?: string`. This property identifies when a message is intended for another agent.
- Adjust parsing logic in `ChatParserService` to recognize when a message is directed at another agent (e.g., by detecting a specific syntax or tag within the message content).

#### 2. Modifying `ChatExecutionService` for Inter-Agent Communication
- Update `ChatExecutionService` to include logic for detecting messages intended for other agents, based on the new `targetAgent` property of `Message` objects.
- When a message for another agent is detected:
  - Create a new chat, adjusting it for the target agent. This includes setting the `agent` property to the target agent and initializing the message list with the relevant message.
  - Create a new file name based on the current conversation's context and the target agent's name to uniquely identify the new chat file.
  - Utilize the existing `processChat` method to process the cloned chat for the target agent, ensuring the output is written to the new file.
  - Update the original chat with a reference to the new chat's outcome (if necessary). This might be a path to the new chat file or a summary of the agent's response.
- Ensure that `processChat` can handle recursive cases without causing infinite loops. This is crucial if agents start communicating in cycles.

#### 3. File Management and Naming Convention
- Define a naming convention for inter-agent chat files that encapsulates both the initiating agent's identity and the target agent's identity, along with a timestamp or unique identifier to avoid collisions.
- Implement file creation and management logic within `ChatExecutionService` to handle these new files, ensuring they are stored in the appropriate directory.

#### 4. Agent Service Adjustments
- Update `AgentsService` to support dynamic lookup of agents based on requests coming from other agents. This may include caching mechanisms for quick retrieval of agent details.
- Ensure the agent loading and initialization process is capable of handling additional demands from inter-agent communications.

#### 5. Testing and Validation
- Develop unit tests for the new features, focusing on:
  - Correct parsing of agent-directed messages.
  - Proper file management for inter-agent chat logs.
  - Validation of chat content for inter-agent communications.
- Perform integration testing to confirm that agents can effectively communicate and that their interactions are correctly logged.

#### Tools and Technologies Used
- The existing TypeScript codebase and associated libraries.
- OClif framework for any additional CLI interactions required.
- Node.js file system module for file management tasks.
- Jest or a similar framework for testing newly implemented features.

### Conclusion
By extending the existing chat model and `ChatExecutionService`, we can introduce a powerful feature enabling agents to collaborate and share information. This plan outlines the necessary steps and considerations to implement inter-agent communication effectively, ensuring that the application remains extensible and maintainable.

---
# User
