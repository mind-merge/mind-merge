import { Message } from "./message";

export type AsyncIterableChunk = AsyncIterable<Chunk> | Chunk[];

interface Chunk {
    choices?: { delta?: { content?: string } }[]; // For OpenAI
    delta?: { text?: string };  // For Claude
    text: () => string; // For Gemini
}

export interface IModel {
    completeChatRequest(messages: Message[]): Promise<unknown>;
}