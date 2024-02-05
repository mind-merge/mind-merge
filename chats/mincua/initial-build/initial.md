# User
Let's make the AgentsService class store a list of agents, 
each agent will be represented by a class Agent that will store the:
- name
- description
- prompt
- the model used(optional)
- input data structure & description - string, also optional
- and output data description.

The AgentsService class should load all markdown files in the `promots/agents` folder, parse them and create Agent 
instances for each one. 

The markdown files will be structured like this:
```markdown
---
name: coding-agent
description: Agent that helps with coding tasks
model: gpt-4-turbo-preview
inputData: This agent takes a description of a coding task as input, in plain text, as descriptive as possible
outputData: The agent will output a code snippet that solves the task in a codeblock.
---
You are an experienced coding agent, you take a coding task and return code that solves it.
Return only the code in a codeblock, no other text.
```


The AgentsService class should have a method `getAgent` that takes the name of an agent and returns the Agent instance
for that agent. If the agent does not exist, it should return None.

---

# Agent

This is a test answer
This is a test answer
 2 
This is a test answer
 3 
This is a test answer
 4 
This is a test answer
 5 

---
# Agent

This is a test answer
This is a test answer
 2 
This is a test answer
 3 
This is a test answer
 4 
This is a test answer
 5 
