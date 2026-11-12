import type { AdapterRequest, ChatAdapter, ModelEvent } from './adapter.ts'

function tokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4))
}

function chunks(text: string) {
  return text.match(/\S+\s*/g) ?? [text]
}

function lastUserText(request: AdapterRequest) {
  for (let i = request.conversation.length - 1; i >= 0; i--) {
    const item = request.conversation[i]
    if (item.role === 'user') return item.content.toLowerCase()
  }
  return ''
}

function toolResultsSinceLastUser(request: AdapterRequest) {
  let count = 0
  for (let i = request.conversation.length - 1; i >= 0; i--) {
    const item = request.conversation[i]
    if (item.role === 'user') break
    if (item.role === 'tool') count += 1
  }
  return count
}

export const fakeAdapter: ChatAdapter = async function* (request): AsyncGenerator<ModelEvent> {
  const question = lastUserText(request)
  const toolResults = toolResultsSinceLastUser(request)
  const inputTokens =
    tokens(request.system) + request.conversation.reduce((sum, item) => sum + tokens(JSON.stringify(item)), 0)

  if (/\b(error|fail)\b/.test(question)) {
    throw new Error('Fake cloud scripted error')
  }

  if (/\b(tool|video|resume|email|gym)\b/.test(question) && toolResults === 0) {
    const name = request.tools[0]?.name ?? 'fake_tool'
    yield { type: 'tool_call', call: { id: 'fake-call-1', name, input: {} } }
    yield { type: 'usage', inputTokens, outputTokens: 12 }
    return
  }

  const answer =
    toolResults > 0
      ? 'Here is what the tool returned.'
      : 'Dillon works across the data lifecycle in healthcare and life sciences. This is a scripted answer from the fake cloud.'
  for (const delta of chunks(answer)) {
    yield { type: 'text', delta }
  }
  if (toolResults === 0) {
    yield { type: 'sources', sources: [{ title: 'About', path: '/about' }] }
  }
  yield { type: 'usage', inputTokens, outputTokens: tokens(answer) }
}
