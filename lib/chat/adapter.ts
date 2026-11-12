import type { ChatMessage, Source, ToolDefinition } from './types.ts'

export interface ToolCall {
  id: string
  name: string
  input: unknown
}

export type ConversationItem =
  | ChatMessage
  | { role: 'assistant'; content: string; toolCalls: ToolCall[] }
  | { role: 'tool'; callId: string; name: string; result: unknown }

export type ModelEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_call'; call: ToolCall }
  | { type: 'sources'; sources: Source[] }
  | { type: 'usage'; inputTokens: number; outputTokens: number }

export interface AdapterRequest {
  conversation: ConversationItem[]
  system: string
  tools: ToolDefinition[]
  signal?: AbortSignal
}

export type ChatAdapter = (request: AdapterRequest) => AsyncIterable<ModelEvent>
