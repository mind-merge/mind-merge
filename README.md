# MindMerge

MindMerge is an innovative tool designed to seamlessly integrate AI agents into your development workflow. It automates the creation and management of AI agents within your git projects, enabling efficient collaboration between developers and AI assistants.

## Features

- **AI Agents Structure**: Automatically generates a directory structure within git projects for hosting AI agents, their prompts, skills, chats, and associated tools.
- **Agent and Tool Definition**: Define AI agents and tools using markdown and YAML files, making them easy to share and version control.
- **Multi-Agent Execution**: Run up to three background agents concurrently per project for optimized resource utilization and faster response times.
- **AI Model Integration**: Supports OpenAI, Anthropic, Google, and Groq models, with plans to support additional models in future releases.
- **CLI Interaction**: Interact with AI agents, initiate chats, and manage tool executions through a user-friendly command-line interface.
- **Agent Collaboration**: Facilitate communication between different AI agents and tools to automate complex workflows and tasks within your development environment.
- **Resource Management**: Efficiently manage generated files and diffs, ensuring that outputs from AI interactions are properly stored and versioned.
- **Extensibility**: Create and share npm packages with custom agents and tools.

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- Valid API tokens for supported AI models

### Installation

Install MindMerge globally using npm:

```bash
npm install -g @mind-merge-ai/mind-merge
```

### Environment Variables

Set up the following environment variables with your API keys:

```bash
CLAUDE_API_KEY=your_claude_api_key
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Basic Usage

1. Initialize MindMerge in your project:
   ```bash
   mm init
   ```

2. Start the MindMerge listener:
   ```bash
   mm start
   ```

3. Create a new chat:
   ```bash
   mm chats:new --user="your-name" --name="chat-name"
   ```

4. Edit the generated markdown file in the `ai/chats/your-name/chat-name/` directory to interact with AI agents.

5. To get an agent to respond to your query:
    - Write your message in the chat file
    - End the file with "\n---\n"
    - Save the file to disk
    - The listener service will pick up the change and execute the request
    - The agent's reply will be appended to the same file

6. To edit a query:
    - Delete the agent's response from the file
    - Update your message above
    - End the file with "\n---\n" and save it to trigger a new response

## Project Structure

MindMerge creates the following directory structure in your project:

```
ai/
├── agents/
│   └── {agent-name}/
│       ├── {agent-name}.md
│       └── tools/
├── tools/
└── chats/
    └── {user-name}/
        └── {chat-name}/
            ├── chat.md
            └── resources/
```

## Extending MindMerge

You can create npm packages with custom agents and tools. Check out [@mind-merge-ai/base-models](https://www.npmjs.com/package/@mind-merge-ai/base-models) for the structure and examples of how to create your own extensions.

## Documentation

For more detailed information on how to use MindMerge, define agents and tools, and interact with the system, please refer to our [documentation](link-to-documentation).

## Contributing

We welcome contributions to MindMerge! Please read our [Contributing Guide](link-to-contributing-guide) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [GNU General Public License v3.0 (GPLv3)](https://www.gnu.org/licenses/gpl-3.0.en.html).

## Acknowledgments

- This project was inspired by the need for better integration of AI assistants in development workflows.
- Special thanks to the [Aider](https://github.com/paul-gauthier/aider) project for inspiration on diff handling.

## Contact

For questions, suggestions, or support, please [open an issue](link-to-issues) on our GitHub repository.

---

Happy coding with MindMerge! 🧠💻