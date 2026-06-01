import { z } from 'zod'

import type { GymChatChartSpec, GymChatCitation, GymChatQuery } from '@/types/gym-chat'
import { interpretSqlError } from './sql-errors'

export type OpenAIToolCall = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string
  tool_call_id?: string
  tool_calls?: OpenAIToolCall[]
}

export type OpenAITool = {
  type: 'function'
  function: {
    name: string
    description?: string
    parameters: Record<string, unknown>
  }
}

export type ToolCallResult = {
  queries: GymChatQuery[]
}

export type GymChatLlmResult = {
  assistantMessage: string
  queries: GymChatQuery[]
  citations: GymChatCitation[]
  chartSpecs?: GymChatChartSpec[]
  followUps?: string[]
}

const resolveApiKey = () => process.env.OPENAI_API_KEY || process.env.GYM_CHAT_OPENAI_API_KEY || ''
const resolveApiBase = () => process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1'
const resolveModel = () => process.env.GYM_CHAT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o'

export type LlmRequestError = Error & {
  isLlmError: true
  status?: number
  detail?: string
  retryable?: boolean
}

export const isLlmRequestError = (error: unknown): error is LlmRequestError =>
  Boolean(error && typeof error === 'object' && 'isLlmError' in error)

const buildLlmError = (
  message: string,
  info: { status?: number; detail?: string; retryable?: boolean },
): LlmRequestError => {
  const error = new Error(message) as LlmRequestError
  error.isLlmError = true
  error.status = info.status
  error.detail = info.detail
  error.retryable = info.retryable
  return error
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])
const MAX_LLM_ATTEMPTS = 3
const LLM_TIMEOUT_MS = 30000

type LlmRetryBudget = {
  remainingMs: () => number
  minRetryWindowMs?: number
}

type LlmRequestOptions = {
  maxAttempts?: number
  timeoutMs?: number
  budget?: LlmRetryBudget
  shouldRetry?: (info: {
    attempt: number
    maxAttempts: number
    status?: number
    retryable: boolean
    detail?: string
  }) => boolean
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const extractJson = (content: string) => {
  const trimmed = content.trim()
  if (trimmed.startsWith('```')) {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced?.[1]) {
      return fenced[1].trim()
    }
  }
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }
  return trimmed
}

const callOpenAIJson = async <T>(
  schema: z.ZodType<T>,
  messages: OpenAIMessage[],
  temperature: number,
  options?: LlmRequestOptions,
) => {
  const apiKey = resolveApiKey()
  if (!apiKey) {
    throw buildLlmError('Missing OpenAI API key.', { status: 401, retryable: false })
  }
  const payload = JSON.stringify({
    model: resolveModel(),
    temperature,
    response_format: { type: 'json_object' },
    messages,
  })

  const maxAttempts = options?.maxAttempts ?? MAX_LLM_ATTEMPTS
  const timeoutMs = options?.timeoutMs ?? LLM_TIMEOUT_MS
  const shouldRetry = (info: {
    attempt: number
    maxAttempts: number
    status?: number
    retryable: boolean
    detail?: string
  }) => {
    if (!info.retryable || info.attempt >= info.maxAttempts) return false
    if (options?.budget) {
      const remainingMs = options.budget.remainingMs()
      const minRetryWindowMs = options.budget.minRetryWindowMs ?? 2000
      if (remainingMs <= minRetryWindowMs) {
        return false
      }
    }
    return options?.shouldRetry ? options.shouldRetry(info) : true
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      response = await fetch(`${resolveApiBase()}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: payload,
        signal: controller.signal,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw buildLlmError('LLM request timed out.', {
          status: 504,
          detail: 'Timed out waiting for model response.',
          retryable: false,
        })
      }
      const detail = error instanceof Error ? error.message : 'Network error'
      const retryable = true
      if (shouldRetry({ attempt, maxAttempts, retryable, detail })) {
        await sleep(200 * attempt)
        continue
      }
      throw buildLlmError(`LLM request failed: ${detail}`, { retryable, detail })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const detail = await response.text()
      const retryable = RETRYABLE_STATUS.has(response.status)
      if (shouldRetry({ attempt, maxAttempts, retryable, detail, status: response.status })) {
        await sleep(200 * attempt)
        continue
      }
      throw buildLlmError(`LLM request failed: ${detail}`, {
        status: response.status,
        detail,
        retryable,
      })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content ?? ''
    const json = extractJson(content)
    try {
      const parsed = JSON.parse(json)
      return schema.parse(parsed)
    } catch (error) {
      throw buildLlmError('LLM response invalid.', {
        status: response.status,
        detail: error instanceof Error ? error.message : 'Invalid response format',
        retryable: false,
      })
    }
  }

  throw buildLlmError('LLM request failed.', { retryable: true })
}

type OpenAIChatResponse = {
  choices?: Array<{
    finish_reason?: string
    message?: {
      role?: string
      content?: string | null
      tool_calls?: OpenAIToolCall[]
    }
  }>
}

const callOpenAIChat = async (
  messages: OpenAIMessage[],
  tools: OpenAITool[],
  temperature: number,
  options?: LlmRequestOptions,
): Promise<OpenAIChatResponse> => {
  const apiKey = resolveApiKey()
  if (!apiKey) {
    throw buildLlmError('Missing OpenAI API key.', { status: 401, retryable: false })
  }
  const payload = JSON.stringify({
    model: resolveModel(),
    temperature,
    messages,
    tools,
    tool_choice: 'auto',
  })

  const maxAttempts = options?.maxAttempts ?? MAX_LLM_ATTEMPTS
  const timeoutMs = options?.timeoutMs ?? LLM_TIMEOUT_MS
  const shouldRetry = (info: {
    attempt: number
    maxAttempts: number
    status?: number
    retryable: boolean
    detail?: string
  }) => {
    if (!info.retryable || info.attempt >= info.maxAttempts) return false
    if (options?.budget) {
      const remainingMs = options.budget.remainingMs()
      const minRetryWindowMs = options.budget.minRetryWindowMs ?? 2000
      if (remainingMs <= minRetryWindowMs) {
        return false
      }
    }
    return options?.shouldRetry ? options.shouldRetry(info) : true
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      response = await fetch(`${resolveApiBase()}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: payload,
        signal: controller.signal,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw buildLlmError('LLM request timed out.', {
          status: 504,
          detail: 'Timed out waiting for model response.',
          retryable: false,
        })
      }
      const detail = error instanceof Error ? error.message : 'Network error'
      const retryable = true
      if (shouldRetry({ attempt, maxAttempts, retryable, detail })) {
        await sleep(200 * attempt)
        continue
      }
      throw buildLlmError(`LLM request failed: ${detail}`, { retryable, detail })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const detail = await response.text()
      const retryable = RETRYABLE_STATUS.has(response.status)
      if (shouldRetry({ attempt, maxAttempts, retryable, detail, status: response.status })) {
        await sleep(200 * attempt)
        continue
      }
      throw buildLlmError(`LLM request failed: ${detail}`, {
        status: response.status,
        detail,
        retryable,
      })
    }

    return (await response.json()) as OpenAIChatResponse
  }

  throw buildLlmError('LLM request failed.', { retryable: true })
}

const buildToolResultPayload = (queries: GymChatQuery[]) => ({
  queries: queries.map(query => {
    let error: string | null = query.error ?? null
    if (error) {
      const { diagnosis, suggestion } = interpretSqlError(error)
      error = `${diagnosis} Fix: ${suggestion}`
    }
    return {
      id: query.id,
      purpose: query.purpose,
      rowCount: query.rowCount,
      rows: query.previewRows,
      error,
      ...(query.exerciseSuggestions?.length
        ? { exerciseSuggestions: query.exerciseSuggestions }
        : {}),
    }
  }),
})

const extractCitations = (text: string, queries: GymChatQuery[]): GymChatCitation[] => {
  const citations: GymChatCitation[] = []
  const markerRegex = /\[(q\d+)\]/g
  let match: RegExpExecArray | null
  while ((match = markerRegex.exec(text)) !== null) {
    const queryId = match[1]
    const query = queries.find(item => item.id === queryId)
    if (query && !query.error) {
      citations.push({
        marker: queryId,
        queryId,
        rowStart: 0,
        rowEnd: Math.max(0, (query.previewRows?.length ?? 1) - 1),
      })
    }
  }
  return citations
}

const CHART_SPEC_SCHEMA = z.object({
  charts: z
    .array(
      z.object({
        type: z.enum(['line', 'bar']),
        queryId: z.string(),
        x: z.string(),
        y: z.string(),
        title: z.string().optional(),
      }),
    )
    .max(2),
})

const CHART_SPEC_SYSTEM = `You decide when workout query results should be visualized as a chart.

Always respond with this JSON format — never wrap it in another key:
{"charts":[{"type":"bar","queryId":"q1","x":"exercise","y":"volume","title":"Volume by exercise"}]}
When nothing is chartable: {"charts":[]}

When to generate a chart (REQUIRED if any of these apply):
- Query has 3+ rows, one field is a category (exercise names, body parts, muscle groups, splits), another is numeric (volume, count, weight, reps) → type "bar"
- Query has 3+ rows, one field is a date/week/month, another is numeric → type "line"

Rules:
- queryId: exact id string from the provided queries array (e.g. "q1") — do not invent ids
- x: the categorical or time field (exact name from that query's fields list)
- y: the numeric field (exact name from that query's fields list; "27570.0" string format still counts as numeric)
- title: 3-6 words, sentence case, no trailing period
- Maximum 2 charts total`

async function generateChartSpecs(
  queries: GymChatQuery[],
  options?: LlmRequestOptions,
): Promise<GymChatChartSpec[] | undefined> {
  const chartable = queries.filter(q => !q.error && q.previewRows.length >= 3)
  if (!chartable.length) return undefined

  // Skip if the request budget is running low — chart generation is non-critical
  if (options?.budget && options.budget.remainingMs() < 10000) return undefined

  const queryContext = chartable.map(q => ({
    id: q.id,
    fields: Object.keys(q.previewRows[0] ?? {}),
    sampleRows: q.previewRows.slice(0, 3),
  }))

  const messages: OpenAIMessage[] = [
    { role: 'system', content: CHART_SPEC_SYSTEM },
    { role: 'user', content: JSON.stringify({ queries: queryContext }) },
  ]

  try {
    const raw = await callOpenAIJson(z.unknown(), messages, 0, {
      ...(options ?? {}),
      maxAttempts: 1,
      timeoutMs: 8000,
    })
    const parsed = CHART_SPEC_SCHEMA.safeParse(raw)
    if (!parsed.success) {
      console.error('generateChartSpecs: schema mismatch:', parsed.error.message, JSON.stringify(raw))
      return undefined
    }
    return parsed.data.charts.length ? parsed.data.charts : undefined
  } catch (err) {
    console.error('generateChartSpecs failed:', err instanceof Error ? err.message : err)
    return undefined
  }
}

const FOLLOW_UP_SECTION_REGEX = /\n*\*\*Follow-up questions?:\*\*\s*[\s\S]*$/i

const extractFollowUps = (text: string): string[] | undefined => {
  const followUpMatch = text.match(/\*\*Follow-up questions?:\*\*\s*([\s\S]*?)$/i)
  if (!followUpMatch) return undefined
  const lines = followUpMatch[1]
    .split('\n')
    .map(line => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(line => line.length > 0 && line.endsWith('?'))
  return lines.length > 0 ? lines.slice(0, 4) : undefined
}

const stripFollowUpSection = (text: string): string =>
  text.replace(FOLLOW_UP_SECTION_REGEX, '').trimEnd()

export async function runGymChatConversation(input: {
  systemPrompt: string
  messages: OpenAIMessage[]
  tools: OpenAITool[]
  executeQueries: (
    queries: Array<{ id: string; purpose: string; sql: string; params: unknown[] }>,
  ) => Promise<ToolCallResult>
  onStatus?: (stage: string, message: string) => void
  options?: LlmRequestOptions
}): Promise<GymChatLlmResult> {
  const messages = input.messages
  if (!messages.length || messages[0].role !== 'system') {
    messages.unshift({ role: 'system', content: input.systemPrompt })
  }

  const executedQueries: GymChatQuery[] = []
  let assistantMessage = ''

  for (let round = 0; round < 4; round += 1) {
    input.onStatus?.('thinking', 'Analyzing your question...')
    const response = await callOpenAIChat(messages, input.tools, 0.2, input.options)
    const choice = response?.choices?.[0]
    if (!choice || !choice.message) {
      throw buildLlmError('LLM response missing message.', { status: 500, retryable: false })
    }

    const toolCalls = choice.message.tool_calls ?? []
    if (toolCalls.length) {
      messages.push({
        role: 'assistant',
        content: choice.message.content ?? '',
        tool_calls: toolCalls,
      })

      for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') {
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: 'Unsupported tool call type.' }),
          })
          continue
        }
        if (toolCall.function.name !== 'execute_gym_query') {
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: `Unsupported tool: ${toolCall.function.name}` }),
          })
          continue
        }

        let parsedArgs: { queries?: Array<{ id: string; purpose: string; sql: string; params: unknown[] }> } = {}
        try {
          parsedArgs = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {}
        } catch {
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: 'Invalid tool arguments JSON.' }),
          })
          continue
        }

        const queries = Array.isArray(parsedArgs.queries) ? parsedArgs.queries : []
        input.onStatus?.('query', 'Running database queries...')
        const result = await input.executeQueries(queries)
        for (const query of result.queries) {
          const idx = executedQueries.findIndex(q => q.id === query.id)
          if (idx !== -1) {
            executedQueries[idx] = query
          } else {
            executedQueries.push(query)
          }
        }
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(buildToolResultPayload(result.queries)),
        })
      }
      continue
    }

    assistantMessage = choice.message.content ?? ''
    messages.push({ role: 'assistant', content: assistantMessage })
    break
  }

  if (!assistantMessage) {
    throw buildLlmError('LLM did not return a final response.', { status: 500, retryable: false })
  }

  const citations = extractCitations(assistantMessage, executedQueries)
  const followUps = extractFollowUps(assistantMessage)
  const cleanedMessage = followUps ? stripFollowUpSection(assistantMessage) : assistantMessage

  const chartSpecs = await generateChartSpecs(executedQueries, input.options)
  if (chartSpecs) input.onStatus?.('charting', 'Generating charts...')

  return {
    assistantMessage: cleanedMessage,
    queries: executedQueries,
    citations,
    chartSpecs,
    followUps,
  }
}

export { callOpenAIJson, extractJson }
