# MindMerge 🧠💻

Hey there, fellow code wrangler! 👋 Welcome to MindMerge, your new best friend in the world of AI-powered development. We're here to make your life easier by bringing AI agents right into your workflow. No more context-switching nightmares – just pure, unadulterated coding bliss.

## 🚀 Features

- **AI Agents Structure**: Automagically spawns a directory structure in your git projects for all your AI goodies. It's like `mkdir` on steroids! 📁
- **Agent and Tool Definition**: Define your AI minions using markdown and YAML. Because who doesn't love a good config file, right? 📝
- **Multi-Agent Execution**: Run up to three agents concurrently. It's like having a tiny dev team in your pocket! 👥
- **AI Model Integration**: We've got OpenAI, Anthropic, Google, and Groq models. It's an AI party, and everyone's invited! 🎉
- **CLI Interaction**: Interact with your AI agents through a CLI. Because GUIs are so yesterday. 💻
- **Agent Collaboration**: Get your AI agents to talk to each other. It's like Slack, but for AIs. 💬
- **Resource Management**: Efficient file and diff management. No more "v_final_FINAL_v2" nightmares! 📊
- **Extensibility**: Create and share npm packages with custom agents and tools. Sharing is caring! 🤝

## 🏁 Getting Started

### Prerequisites

- Node.js and npm (you know the drill)
- Git (because time travel is essential)
- API keys for the AI models (gotta catch 'em all!)

### Installation

Fire up your terminal and run:

```bash
npm install -g @mind-merge-ai/mind-merge
```

Easy peasy, lemon squeezy! 🍋

### 🔑 Environment Variables

Set these up in your `.env` file or your system environment:

```bash
ANTHROPIC_API_KEY=your_ANTHROPIC_API_KEY
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
```

Don't forget to keep these secret! 🤫

### 🏃‍♂️ Quick Start

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

4. Find your new markdown file in `ai/chats/your-name/chat-name/` and start chatting with your AI buddy!

5. To get a response:
   - Write your message
   - End with "\n---\n"
   - Save the file
   - Watch the magic happen! ✨

6. Want to change your message?
   - Delete the AI's response
   - Update your message
   - Add "\n---\n" at the end and save
   - Rinse and repeat!

## 📁 Project Structure

Here's what MindMerge will cook up in your project:

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

Neat and tidy, just the way we like it! 🧹

## 🛠 Extending MindMerge

Want to create your own AI agents and tools? Check out [@mind-merge-ai/base-models](https://www.npmjs.com/package/@mind-merge-ai/base-models) for the lowdown. It's like Lego, but for AI! 🧱

## 📚 Documentation

For the nitty-gritty details, head over to our [docs](link-to-documentation). It's riveting reading, we promise! 😉

## 🤝 Contributing

We love contributions! Check out our [Contributing Guide](link-to-contributing-guide) to join the MindMerge party. Don't be shy, we don't bite! 🎈

## ⚖️ License

This project is licensed under the [GNU General Public License v3.0 (GPLv3)](https://www.gnu.org/licenses/gpl-3.0.en.html). It's like a prenup, but for code.

## 🙏 Acknowledgments

- Shoutout to all the developers out there burning the midnight oil. This one's for you! ☕
- Big thanks to the [Aider](https://github.com/paul-gauthier/aider) project for inspiring our diff handling. You rock! 🎸

## 📞 Contact

Got questions? Ideas? Just want to chat? [Open an issue](link-to-issues) on our GitHub repo. We're all ears! 👂

---

Now go forth and code with your new AI sidekick! Remember, with great power comes great responsibility... and really cool AI-assisted commits. 😎

Happy coding with MindMerge! 🚀🧠💻
