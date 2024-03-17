import OpenAI from "openai";
import {Chat, ChatCompletionChunk} from "openai/resources";
import {Stream} from "openai/streaming";

import {Message} from "./message";

import ChatCompletionTool = Chat.ChatCompletionTool;
import ChatCompletionToolChoiceOption = OpenAI.ChatCompletionToolChoiceOption;

export interface ResponseFormat {
    /**
     * Must be one of `text` or `json_object`.
     */
    type?: 'json_object' | 'text';
}

export interface ChatCompletionRequest {
    /**
     * The maximum number of [tokens](/tokenizer) that can be generated in the chat
     * completion.
     *
     * The total length of input tokens and generated tokens is limited by the model's
     * context length.
     * [Example Python code](https://cookbook.openai.com/examples/how_to_count_tokens_with_tiktoken)
     * for counting tokens.
     */
    max_tokens?: null | number;

    messages: Array<Message>;


    /**
     * ID of the model to use. See the
     * [model endpoint compatibility](https://platform.openai.com/docs/models/model-endpoint-compatibility)
     * table for details on which models work with the Chat API.
     */
    model:
        | 'gpt-3.5-turbo'
        | 'gpt-3.5-turbo-0125'
        | 'gpt-3.5-turbo-0301'
        | 'gpt-3.5-turbo-0613'
        | 'gpt-3.5-turbo-16k'
        | 'gpt-3.5-turbo-16k-0613'
        | 'gpt-3.5-turbo-1106'
        | 'gpt-4'
        | 'gpt-4-0125-preview'
        | 'gpt-4-0314'
        | 'gpt-4-0613'
        | 'gpt-4-32k'
        | 'gpt-4-32k-0314'
        | 'gpt-4-32k-0613'
        | 'gpt-4-1106-preview'
        | 'gpt-4-turbo-preview'
        | 'gpt-4-vision-preview'
        | (string & object);

    /**
     * An object specifying the format that the model must output. Compatible with
     * [GPT-4 Turbo](https://platform.openai.com/docs/models/gpt-4-and-gpt-4-turbo) and
     * all GPT-3.5 Turbo models newer than `gpt-3.5-turbo-1106`.
     *
     * Setting to `{ "type": "json_object" }` enables JSON mode, which guarantees the
     * message the model generates is valid JSON.
     *
     * **Important:** when using JSON mode, you **must** also instruct the model to
     * produce JSON yourself via a system or user message. Without this, the model may
     * generate an unending stream of whitespace until the generation reaches the token
     * limit, resulting in a long-running and seemingly "stuck" request. Also note that
     * the message content may be partially cut off if `finish_reason="length"`, which
     * indicates the generation exceeded `max_tokens` or the conversation exceeded the
     * max context length.
     */
    response_format?: ResponseFormat;

    /**
     * This feature is in Beta. If specified, our system will make a best effort to
     * sample deterministically, such that repeated requests with the same `seed` and
     * parameters should return the same result. Determinism is not guaranteed, and you
     * should refer to the `system_fingerprint` response parameter to monitor changes
     * in the backend.
     */
    seed?: null | number;

    /**
     * Up to 4 sequences where the API will stop generating further tokens.
     */
    stop?: Array<string> | null | string;

    /**
     * If set, partial message deltas will be sent, like in ChatGPT. Tokens will be
     * sent as data-only
     * [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format)
     * as they become available, with the stream terminated by a `data: [DONE]`
     * message.
     * [Example Python code](https://cookbook.openai.com/examples/how_to_stream_completions).
     */
    stream?: boolean | null;

    /**
     * What sampling temperature to use, between 0 and 2. Higher values like 0.8 will
     * make the output more random, while lower values like 0.2 will make it more
     * focused and deterministic.
     *
     * We generally recommend altering this or `top_p` but not both.
     */
    temperature?: null | number;

    /**
     * Controls which (if any) function is called by the model. `none` means the model
     * will not call a function and instead generates a message. `auto` means the model
     * can pick between generating a message or calling a function. Specifying a
     * particular function via
     * `{"type": "function", "function": {"name": "my_function"}}` forces the model to
     * call that function.
     *
     * `none` is the default when no functions are present. `auto` is the default if
     * functions are present.
     */
    tool_choice?: ChatCompletionToolChoiceOption;

    /**
     * A list of tools the model may call. Currently, only functions are supported as a
     * tool. Use this to provide a list of functions the model may generate JSON inputs
     * for.
     */
    tools?: Array<ChatCompletionTool>;

}

export interface IModel {
    // TODO: Return typed response
    // TODO: Add options type
    completeChatRequest(request: ChatCompletionRequest): Promise<Stream<ChatCompletionChunk>>;

    getTotalTokensForChatRequest(request: ChatCompletionRequest): Promise<number>;
    isRequestWithinTokenLimit(request: ChatCompletionRequest): boolean;
}