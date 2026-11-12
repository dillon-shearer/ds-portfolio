import type { ZodType } from 'zod'

export const CLOUD_IDS = ['aws', 'azure', 'fake'] as const

export type CloudId = (typeof CLOUD_IDS)[number]

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ToolDefinition<I = unknown> {
  name: string
  description: string
  input: ZodType<I>
}

export interface ChatTool<I = unknown> extends ToolDefinition<I> {
  run: (input: I) => Promise<unknown> | unknown
}

export interface Source {
  title: string
  path: string
}

export type StreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool'; name: string; result: unknown }
  | { type: 'sources'; sources: Source[] }
  | { type: 'done'; cloud: CloudId; responseMs: number; inputTokens: number; outputTokens: number }
  | { type: 'error'; message: string }
