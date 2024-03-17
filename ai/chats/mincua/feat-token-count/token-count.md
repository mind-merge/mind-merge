---
referencedFiles:
  - src/services/chat-execution-service.ts
  - src/services/agents-service.ts
  - src/services/model-service.ts
  - src/model/model.ts
  - src/model/open-ai-model.ts
  - src/model/chat.ts
  - src/model/agent.ts
---
# User

We are working on adding an input token limit for the model, in preparation for adding summarization when a token limit is hit.
The model interface should expose a get total tokens method for a chat request.
We should also implement this in the OpenAI model class.

---
# Agent

To accommodate the new requirement of adding an input token limit and preparing for summarization when a token limit is hit, you need to modify the model interface and the OpenAI model class. Here's how you can go about implementing these changes in TypeScript:

### Step 1: Update the Model Interface (`src/model/model.ts`)

First, you need to modify the `IModel` interface to include a method for getting the total number of tokens for a chat request. This method will calculate the total token count based on the chat messages and possibly other factors you might consider.

```typescript
export interface IModel {
    completeChatRequest(request: ChatCompletionRequest): Promise<any>;

    // New method to calculate the total tokens for a chat request.
    getTotalTokensForChatRequest(messages: Message[]): Promise<number>;
}
```

### Step 2: Implement the New Method in the OpenAI Model Class (`src/model/open-ai-model.ts`)

Next, implement the `getTotalTokensForChatRequest` method in the `OpenAIModel` class. This method will calculate the total number of tokens in the chat messages. For simplicity, let's assume you have a utility function that can approximate the number of tokens based on the message content, as the exact calculation may depend on the model and tokenizer used.

```typescript
import OpenAI from 'openai';
import { Chat, ChatCompletionMessageParam } from "openai/resources";
import { appConstant } from "../constants";
import { ChatCompletionRequest, IModel, Message } from "./model";

import ChatCompletionCreateParamsStreaming = Chat.ChatCompletionCreateParamsStreaming;

// Mock function to approximate token count. This should be replaced with an actual implementation.
// This is just a placeholder and not an accurate representation of how tokens are counted.
const approximateTokenCount = (content: string): number => {
    // Placeholder implementation, replace with actual logic.
    return Math.ceil(content.length / 4);  // Simple example: 1 token per 4 characters.
};

export class OpenAIModel implements IModel {
    constructor(
        private modelName: string,
        private maxInputTokens: number = 4096,
        private maxOutputTokens: number = 4096
        ) {}
    
    async completeChatRequest(request:ChatCompletionRequest) {
        if (request.messages.length === 0) return false;
        
        const openAAIRequest: ChatCompletionCreateParamsStreaming = {
            ...request,
            max_tokens: this.maxOutputTokens,
            messages: request.messages.map((message) => ({
                content: message.content,
                role: message.role
            }) as ChatCompletionMessageParam),
            model: this.modelName,
            stream: true,
            
        };

        return openAI.chat.completions.create(openAAIRequest);
    }

    // IModel implementation: Calculate the total tokens for the chat request
    async getTotalTokensForChatRequest(messages: Message[]): Promise<number> {
        let totalTokens = 0;

        for (let message of messages) {
            totalTokens += approximateTokenCount(message.content);
        }

        return Promise.resolve(totalTokens);
    }
}
```

### Step 3: Use the New Method

With the new method implemented, you can now use it to calculate the total token count for chat requests. This can be particularly useful in ensuring that your requests do not exceed the model's maximum token limit and to decide when summarization might be necessary.

Remember, the actual token count calculation can be complex due to differences in how tokens are counted, especially special characters and spaces. Ideally, you'd rely on the tokenizer's logic provided by the model you're interfacing with (in this case, OpenAI), but this requires access to the tokenizer or detailed documentation on its behavior.


---
# User

The token count should use the gpt-tokenizer library, here are some docs:

## Usage

```typescript
import {
  encode,
  encodeChat,
  decode,
  isWithinTokenLimit,
  encodeGenerator,
  decodeGenerator,
  decodeAsyncGenerator,
} from 'gpt-tokenizer'

const text = 'Hello, world!'
const tokenLimit = 10

// Encode text into tokens
const tokens = encode(text)

// Decode tokens back into text
const decodedText = decode(tokens)

// Check if text is within the token limit
// returns false if the limit is exceeded, otherwise returns the actual number of tokens (truthy value)
const withinTokenLimit = isWithinTokenLimit(text, tokenLimit)

// Example chat:
const chat = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'assistant', content: 'gpt-tokenizer is awesome.' },
]

// Encode chat into tokens
const chatTokens = encodeChat(chat)

// Check if chat is within the token limit
const chatWithinTokenLimit = isWithinTokenLimit(chat, tokenLimit)

// Encode text using generator
for (const tokenChunk of encodeGenerator(text)) {
  console.log(tokenChunk)
}

// Decode tokens using generator
for (const textChunk of decodeGenerator(tokens)) {
  console.log(textChunk)
}

// Decode tokens using async generator
// (assuming `asyncTokens` is an AsyncIterableIterator<number>)
for await (const textChunk of decodeAsyncGenerator(asyncTokens)) {
  console.log(textChunk)
}
```

By default, importing from `gpt-tokenizer` uses `cl100k_base` encoding, used by `gpt-3.5-turbo` and `gpt-4`.

To get a tokenizer for a different model, import it directly, for example:

```ts
import {
  encode,
  decode,
  isWithinTokenLimit,
} from 'gpt-tokenizer/model/text-davinci-003'
```

If you're dealing with a resolver that doesn't support package.json `exports` resolution, you might need to import from the respective `cjs` or `esm` directory, e.g.:

```ts
import {
  encode,
  decode,
  isWithinTokenLimit,
} from 'gpt-tokenizer/cjs/model/text-davinci-003'
```

### Supported models and their encodings

chat:

- `gpt-4-32k` (`cl100k_base`)
- `gpt-4-0314` (`cl100k_base`)
- `gpt-4-32k-0314` (`cl100k_base`)
- `gpt-3.5-turbo` (`cl100k_base`)
- `gpt-3.5-turbo-0301` (`cl100k_base`)

text-only:

- `text-davinci-003` (`p50k_base`)
- `text-davinci-002` (`p50k_base`)
- `text-davinci-001` (`r50k_base`)
- `text-curie-001` (`r50k_base`)
- `text-babbage-001` (`r50k_base`)
- `text-ada-001` (`r50k_base`)
- `davinci` (`r50k_base`)
- `curie` (`r50k_base`)
- `babbage` (`r50k_base`)
- `ada` (`r50k_base`)

code:

- `code-davinci-002` (`p50k_base`)
- `code-davinci-001` (`p50k_base`)
- `code-cushman-002` (`p50k_base`)
- `code-cushman-001` (`p50k_base`)
- `davinci-codex` (`p50k_base`)
- `cushman-codex` (`p50k_base`)

edit:

- `text-davinci-edit-001` (`p50k_edit`)
- `code-davinci-edit-001` (`p50k_edit`)

embeddings:

- `text-embedding-ada-002` (`cl100k_base`)

old embeddings:

- `text-similarity-davinci-001` (`r50k_base`)
- `text-similarity-curie-001` (`r50k_base`)
- `text-similarity-babbage-001` (`r50k_base`)
- `text-similarity-ada-001` (`r50k_base`)
- `text-search-davinci-doc-001` (`r50k_base`)
- `text-search-curie-doc-001` (`r50k_base`)
- `text-search-babbage-doc-001` (`r50k_base`)
- `text-search-ada-doc-001` (`r50k_base`)
- `code-search-babbage-code-001` (`r50k_base`)
- `code-search-ada-code-001` (`r50k_base`)

## API

### `encode(text: string): number[]`

Encodes the given text into a sequence of tokens. Use this method when you need to transform a piece of text into the token format that the GPT models can process.

Example:

```typescript
import { encode } from 'gpt-tokenizer'

const text = 'Hello, world!'
const tokens = encode(text)
```

### `decode(tokens: number[]): string`

Decodes a sequence of tokens back into text. Use this method when you want to convert the output tokens from GPT models back into human-readable text.

Example:

```typescript
import { decode } from 'gpt-tokenizer'

const tokens = [18435, 198, 23132, 328]
const text = decode(tokens)
```

### `isWithinTokenLimit(text: string, tokenLimit: number): false | number`

Checks if the text is within the token limit. Returns `false` if the limit is exceeded, otherwise returns the number of tokens. Use this method to quickly check if a given text is within the token limit imposed by GPT models, without encoding the entire text.

Example:

```typescript
import { isWithinTokenLimit } from 'gpt-tokenizer'

const text = 'Hello, world!'
const tokenLimit = 10
const withinTokenLimit = isWithinTokenLimit(text, tokenLimit)
```

### `encodeChat(chat: ChatMessage[], model?: ModelName): number[]`

Encodes the given chat into a sequence of tokens.

If you didn't import the model version directly, or if `model` wasn't provided during initialization, it must be provided here to correctly tokenize the chat for a given model. Use this method when you need to transform a chat into the token format that the GPT models can process.

Example:

```typescript
import { encodeChat } from 'gpt-tokenizer'

const chat = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'assistant', content: 'gpt-tokenizer is awesome.' },
]
const tokens = encodeChat(chat)
```

### `encodeGenerator(text: string): Generator<number[], void, undefined>`

Encodes the given text using a generator, yielding chunks of tokens.
Use this method when you want to encode text in chunks, which can be useful for processing large texts or streaming data.

Example:

```typescript
import { encodeGenerator } from 'gpt-tokenizer'

const text = 'Hello, world!'
const tokens = []
for (const tokenChunk of encodeGenerator(text)) {
  tokens.push(...tokenChunk)
}
```

### `encodeChatGenerator(chat: Iterator<ChatMessage>, model?: ModelName): Generator<number[], void, undefined>`

Same as `encodeChat`, but uses a generator as output, and may use any iterator as the input `chat`.

### `decodeGenerator(tokens: Iterable<number>): Generator<string, void, undefined>`

Decodes a sequence of tokens using a generator, yielding chunks of decoded text.
Use this method when you want to decode tokens in chunks, which can be useful for processing large outputs or streaming data.

Example:

```typescript
import { decodeGenerator } from 'gpt-tokenizer'

const tokens = [18435, 198, 23132, 328]
let decodedText = ''
for (const textChunk of decodeGenerator(tokens)) {
  decodedText += textChunk
}
```

### `decodeAsyncGenerator(tokens: AsyncIterable<number>): AsyncGenerator<string, void, undefined>`

Decodes a sequence of tokens asynchronously using a generator, yielding chunks of decoded text. Use this method when you want to decode tokens in chunks asynchronously, which can be useful for processing large outputs or streaming data in an asynchronous context.

Example:

```javascript
import { decodeAsyncGenerator } from 'gpt-tokenizer'

async function processTokens(asyncTokensIterator) {
  let decodedText = ''
  for await (const textChunk of decodeAsyncGenerator(asyncTokensIterator)) {
    decodedText += textChunk
  }
}
```

## Special tokens

There are a few special tokens that are used by the GPT models.
Not all models support all of these tokens.

### Custom Allowed Sets

`gpt-tokenizer` allows you to specify custom sets of allowed special tokens when encoding text. To do this, pass a
`Set` containing the allowed special tokens as a parameter to the `encode` function:

```ts
import {
  EndOfPrompt,
  EndOfText,
  FimMiddle,
  FimPrefix,
  FimSuffix,
  ImStart,
  ImEnd,
  ImSep,
  encode,
} from 'gpt-tokenizer'

const inputText = `Some Text ${EndOfPrompt}`
const allowedSpecialTokens = new Set([EndOfPrompt])
const encoded = encode(inputText, allowedSpecialTokens)
const expectedEncoded = [8538, 2991, 220, 100276]

expect(encoded).toBe(expectedEncoded)
```

### Custom Disallowed Sets

Similarly, you can specify custom sets of disallowed special tokens when encoding text. Pass a `Set`
containing the disallowed special tokens as a parameter to the `encode` function:

```ts
import { encode } from 'gpt-tokenizer'

const inputText = `Some Text`
const disallowedSpecial = new Set(['Some'])
// throws an error:
const encoded = encode(inputText, undefined, disallowedSpecial)
```

In this example, an Error is thrown, because the input text contains a disallowed special token.

---
# Agent

Given the guidance to utilize the `gpt-tokenizer` library for token counting within the Mind-merge application, specifically within the implementation of the `getTotalTokensForChatRequest` method in the `OpenAIModel` class, here's how you could modify the `OpenAIModel` class located in `src/model/open-ai-model.ts`:

### Step 1: Import `gpt-tokenizer` Functions

First, you'll import necessary functions from `gpt-tokenizer`. For this context, `encodeChat` and `isWithinTokenLimit` are particularly relevant. 

```typescript
import { encodeChat, isWithinTokenLimit } from 'gpt-tokenizer';
```

### Step 2: Refactor the `OpenAIModel` Class

Modify the `OpenAIModel` class to use `gpt-tokenizer` for token counting. Specifically, you will implement the `getTotalTokensForChatRequest` method to accurately count tokens using `encodeChat` and check constraints with `isWithinTokenLimit` when necessary.

```typescript
import OpenAI from 'openai';
// Assuming these imports are already in place
import { appConstant } from "../constants";
import { ChatCompletionRequest, IModel, Message } from "./model";
import { encodeChat, isWithinTokenLimit } from 'gpt-tokenizer';

export class OpenAIModel implements IModel {
    constructor(
        private modelName: string,
        private maxInputTokens: number = 4096,
        private maxOutputTokens: number = 4096
    ) {}
    
    async completeChatRequest(request: ChatCompletionRequest) {
        // This method remains largely unchanged except for token constraints application logic
        // This example focuses on the implementation of getTotalTokensForChatRequest    
    }

    // Modified: Calculate the total tokens for the chat request using gpt-tokenizer
    async getTotalTokensForChatRequest(messages: Message[]): Promise<number> {
        // Transform messages into the format required by encodeChat
        // Keeping the structure similar to the given encodeChat example
        const chat = messages.map(message => ({
            role: message.role.toLowerCase(), // assuming 'role' matches 'system', 'assistant', etc.
            content: message.content
        }));

        // Encode the chat into tokens with gpt-tokenizer
        const tokens = encodeChat(chat)
        
        // Return the length of the token array as the total token count
        return tokens.length;
    }

    // Optional: Implement checks within token limit when processing requests
    isRequestWithinTokenLimit(request: ChatCompletionRequest): boolean {
        const messages = request.messages.map(message => ({
            role: message.role.toLowerCase(), // assuming 'role' matches 'system', 'assistant', etc.
            content: message.content
        }));
        const tokenCount = encodeChat(messages).length;
        
        // Check if within token limit using isWithinTokenLimit from gpt-tokenizer
        // isWithinTokenLimit returns false if over the limit, or the token count if under.
        const isWithinLimit = isWithinTokenLimit(messages, this.maxInputTokens);
        
        return !!isWithinLimit; // Convert to boolean
    }
}
```

### Step 3: Implementing Token Count Checks

Now that `getTotalTokensForChatRequest` utilizes `gpt-tokenizer` for accurate token counts, you can also integrate additional logic before performing actions that depend on staying within token limits. The `isRequestWithinTokenLimit` method, for example, could be used to decide whether or not to process a request based on token count constraints.

### Further Considerations:

- **Adjusting for Model Specific Encoding**: Depending on the model used (e.g., `gpt-4`, `text-davinci-003`), you might need to import the corresponding tokenizer from `gpt-tokenizer` to ensure accurate token estimates.
- **Extensibility**: With the inclusion of `gpt-tokenizer`, future extensions related to message processing, summarization upon hitting token limits, or even pre-processing steps to reduce token counts, can be more accurately implemented.

---
# User
