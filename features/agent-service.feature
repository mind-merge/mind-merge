Feature: Agent Service
  As a user
  I want to test the Agent Service
  So that I can ensure it works correctly

Scenario: Load Agent
  Given the agent service is initialized
  When the agent service loads an agent named main and filepath ai/prompts/agents/main
  Then the agent named main should be loaded correctly
