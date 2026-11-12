import type { ChatTool } from './types.ts'

export interface ToolRegistry {
  register: <I>(tool: ChatTool<I>) => void
  lookup: (name: string) => ChatTool | undefined
  list: () => ChatTool[]
}

export function createRegistry(): ToolRegistry {
  const tools = new Map<string, ChatTool>()
  return {
    register(tool) {
      if (tools.has(tool.name)) throw new Error(`Tool already registered: ${tool.name}`)
      tools.set(tool.name, tool as unknown as ChatTool)
    },
    lookup(name) {
      return tools.get(name)
    },
    list() {
      return [...tools.values()]
    },
  }
}

export const toolRegistry = createRegistry()

export const registerTool = toolRegistry.register
export const lookupTool = toolRegistry.lookup
