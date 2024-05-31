Feature: Model Service
  In order to access different models
  As a developer
  I want the ModelService to return the appropriate model instance based on the provider and model name

  Scenario: Get model for supported provider
    Given the ModelService has no models in cache
    When I request a model for openai provider with name gpt-4-turbo-preview
    Then the service should return a model gpt-4-turbo-preview