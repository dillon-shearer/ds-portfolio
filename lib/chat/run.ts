import type { ChatAdapter, ConversationItem, ToolCall } from './adapter.ts'
import type { ToolRegistry } from './registry.ts'
import type { ChatMessage, CloudId, StreamEvent } from './types.ts'

export const MAX_TOOL_ROUNDS = 4

export interface RunChatOptions {
  cloud: CloudId
  adapter: ChatAdapter
  messages: ChatMessage[]
  system: string
  registry: ToolRegistry
  signal?: AbortSignal
  now?: () => number
}

async function runTool(registry: ToolRegistry, call: ToolCall): Promise<unknown> {
  const tool = registry.lookup(call.name)
  if (!tool) return { error: `Unknown tool: ${call.name}` }
  const parsed = tool.input.safeParse(call.input)
  if (!parsed.success) return { error: 'Invalid tool input' }
  try {
    return await tool.run(parsed.data)
  } catch (err) {
    console.error(`Chat tool ${call.name} failed:`, err)
    return { error: 'Tool failed' }
  }
}

export async function* runChat(options: RunChatOptions): AsyncGenerator<StreamEvent> {
  const { cloud, adapter, messages, system, registry, signal } = options
  const now = options.now ?? Date.now
  const start = now()
  const conversation: ConversationItem[] = [...messages]
  const tools = registry.list().map(({ name, description, input }) => ({ name, description, input }))
  let inputTokens = 0
  let outputTokens = 0
  let rounds = 0

  try {
    while (true) {
      let text = ''
      const calls: ToolCall[] = []
      for await (const event of adapter({ conversation, system, tools, signal })) {
        if (event.type === 'text') {
          text += event.delta
          yield { type: 'text', delta: event.delta }
        } else if (event.type === 'tool_call') {
          calls.push(event.call)
        } else if (event.type === 'sources') {
          if (event.sources.length > 0) yield { type: 'sources', sources: event.sources }
        } else if (event.type === 'usage') {
          inputTokens += event.inputTokens
          outputTokens += event.outputTokens
        }
      }
      if (calls.length === 0) break
      if (rounds >= MAX_TOOL_ROUNDS) {
        yield { type: 'error', message: `Stopped after ${MAX_TOOL_ROUNDS} tool rounds.` }
        return
      }
      rounds += 1
      conversation.push({ role: 'assistant', content: text, toolCalls: calls })
      for (const call of calls) {
        const result = await runTool(registry, call)
        yield { type: 'tool', name: call.name, result }
        conversation.push({ role: 'tool', callId: call.id, name: call.name, result })
      }
    }
  } catch (err) {
    console.error(`Chat adapter ${cloud} failed:`, err)
    yield { type: 'error', message: 'The model call failed. Please try again.' }
    return
  }

  yield { type: 'done', cloud, responseMs: Math.round(now() - start), inputTokens, outputTokens }
}
