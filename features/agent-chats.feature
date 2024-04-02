Feature: Define an agent and chat with it

  Scenario: Define an agent
    Given I have an agent named "Alice"
    Then I should see "Alice" in the list of agents