import { randomUUID } from 'crypto'

import { NextResponse } from 'next/server'
import { createClient, createPool } from '@vercel/postgres'

import { getCatalogContext, getBodyPartsContext, loadBodyParts, loadGymCatalog } from '@/lib/gym-chat/catalog'
import { getCapabilitiesContext } from '@/lib/gym-chat/capabilities'
import { SEMANTIC_HINTS } from '@/lib/gym-chat/semantics'
import {
  MAX_PREVIEW_ROWS,
  QUERY_TIMEOUT_MS,
  validateAndRewriteSql,
} from '@/lib/gym-chat/sql-policy'
import { suggestExerciseNames } from '@/lib/gym-chat/response-utils'
import {
  runGymChatConversation,
  isLlmRequestError,
  type OpenAIMessage,
  type OpenAITool,
} from '@/lib/gym-chat/llm'
import type {
  GymChatConversationState,
  GymChatMessage,
  GymChatQuery,
  GymChatResponse,
} from '@/types/gym-chat'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_DURATION_MS = maxDuration * 1000
const MIN_LLM_RETRY_WINDOW_MS = 16000

const EXECUTE_GYM_QUERY_TOOL: OpenAITool = {
  type: 'function',
  function: {
    name: 'execute_gym_query',
    description:
      "Execute one or more read-only SQL queries against the gym workout database. Returns query results with rows of data. Use this whenever you need actual workout data to answer the user's question.",
    parameters: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique query ID (q1, q2, q3, etc.)',
              },
              purpose: {
                type: 'string',
                description: 'Brief description of what this query measures',
              },
              sql: {
                type: 'string',
                description: 'A SELECT-only SQL query following the SQL rules in the system prompt',
              },
              params: {
                type: 'array',
                items: {},
                description: 'Array of parameterized values matching $1, $2, etc. placeholders in the SQL',
              },
            },
            required: ['id', 'purpose', 'sql', 'params'],
          },
          description:
            'One or more SQL queries to execute. Use multiple queries for comparisons, multi-metric analysis, or when you need different aggregations.',
        },
      },
      required: ['queries'],
    },
  },
}

const resolveReadonlyConnection = () => {
  const readonly = process.env.GYM_CHAT_DATABASE_URL_READONLY
  if (readonly) return { url: readonly, fallback: false }
  if (process.env.NODE_ENV === 'development') {
    const fallback = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
    if (fallback) {
      return { url: fallback, fallback: true }
    }
  }
  return null
}

const normalizeMessages = (messages: GymChatMessage[]) =>
  messages.filter(message => message && message.role && message.content)

const extractLatestUserQuestion = (messages: GymChatMessage[]) => {
  const reversed = [...messages].reverse()
  return reversed.find(message => message.role === 'user')?.content ?? ''
}

const formatCellValue = (value: unknown) => {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'bigint') return Number(value)
  if (value && typeof value === 'object') return JSON.stringify(value)
  return value
}

type Queryable = {
  query: (query: string | { text: string; values?: unknown[] }, params?: unknown[]) => Promise<any>
}

const executeQuery = async (client: Queryable, sql: string, params: unknown[]) => {
  const started = Date.now()
  try {
    await client.query('BEGIN')
    await client.query(`SET LOCAL statement_timeout = ${QUERY_TIMEOUT_MS}`)
    const result = await client.query({
      text: sql,
      values: params ?? [],
    })
    await client.query('COMMIT')
    const durationMs = Date.now() - started
    const rows = result.rows ?? []
    return {
      rowCount: result.rowCount ?? rows.length,
      durationMs,
      rows: rows.map((row: Record<string, unknown>) =>
        Object.fromEntries(Object.entries(row).map(([key, value]) => [key, formatCellValue(value)])),
      ),
    }
  } catch (error) {
    await client.query('ROLLBACK')
    const durationMs = Date.now() - started
    return {
      rowCount: 0,
      durationMs,
      rows: [],
      error: error instanceof Error ? error.message : 'Query failed.',
    }
  }
}

const buildSystemPrompt = (timezone: string): string => {
  const catalogContext = getCatalogContext()
  const capabilities = getCapabilitiesContext()
  const semanticHints = SEMANTIC_HINTS
  const bodyPartsContext = getBodyPartsContext()

  return `You are a no-nonsense bodybuilding coach with access to the user's complete workout history in a PostgreSQL database. You think in terms of progressive overload, volume landmarks, frequency, and long-term adaptation. You don't hype — you analyze. When the data shows real progress, acknowledge it. When there's a stall, an imbalance, or a gap in training, call it out plainly and say what should change. Your job is to help the user train smarter, not to make them feel good about mediocre results.

## Database Schema
${catalogContext}

## Metric Definitions & Data Scope
${capabilities}

## SQL Patterns
${semanticHints}
${bodyPartsContext ? `\n## Available Body Part Values\n${bodyPartsContext}` : ''}

## Tool Results
When you call execute_gym_query, the tool returns:
{ "queries": [ { "id": "q1", "purpose": "...", "rowCount": N, "rows": [...], "error": null | "..." } ] }

- rows contains up to 20 preview rows; rowCount is the total.
- Never cite a query with a non-null error.
- If rowCount is 0 and the query filtered on an exercise name, run a follow-up to discover the canonical name: SELECT name FROM exercises WHERE name ILIKE $1 (or query exercise_aliases.alias). Use a broad wildcard like '%bench%'. If matches are found, list them and ask which was intended.

## SQL Rules
- SELECT only. No INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, UNION, VALUES, or recursive CTEs.
- Use exact table and column names from the schema. Never SELECT *.
- No schema-qualified table names (gym_lifts, not public.gym_lifts).
- ALL string values in WHERE, HAVING, or JOIN conditions must use $1..$n parameterized placeholders — exercise names, day tags, body parts, LIKE patterns, everything. No literal strings in SQL.
- Relative time windows: CURRENT_DATE - ($1)::interval (never INTERVAL $1).
- No FILTER aggregates or explicit window frames (ROWS BETWEEN / RANGE BETWEEN). Use CASE expressions and default window frames.
- Muscle-aware queries (volume by muscle, exercises targeting a muscle, top sets per muscle): query gym_lifts_v and filter or group on body_part_key. Use raw gym_lifts only when anatomy is irrelevant.
- Session-intent queries (which muscles were planned for a day, push/pull/leg): use gym_day_meta.body_parts (text[]) with UNNEST(body_parts) AS body_part. This is INTENT, not what was actually logged.
- Default time windows: set-level queries = last 90 days; trend/weekly/monthly = last 12 months. These are enforced server-side if omitted.
- All-time queries: prepend /*policy:time_window=all_time*/ before the SELECT.
- session_date and performed_at are NOT columns in gym_lifts or gym_lifts_v — they are aliases defined only inside the sets CTE. Any query that filters, groups, or orders by date MUST define the sets CTE first. Wrong: FROM gym_lifts_v WHERE session_date >= ... (column does not exist). Right: WITH sets AS (...) SELECT ... FROM sets WHERE sets.session_date >= ...
- Always use the shared sets CTE for date-aware queries against gym_lifts: WITH sets AS (SELECT exercise, weight, reps, COALESCE(date::date, timestamp::date) AS session_date, COALESCE(timestamp::timestamptz, date::timestamptz) AS performed_at FROM gym_lifts)
- Sets CTE for date-aware queries against gym_lifts_v: WITH sets AS (SELECT canonical_name, body_part_key, exercise_id, weight, reps, COALESCE(date::date, timestamp::date) AS session_date, COALESCE(timestamp::timestamptz, date::timestamptz) AS performed_at FROM gym_lifts_v)
- CTE scoping: only reference the CTE alias in outer queries. Never reference gym_lifts or gym_lifts_v outside the CTE when date aliases are needed.
- Apply date filters in the CTE, not the outer query (unless using sets.session_date directly).
- Default row limit: 200. Hard limit: 1000. Top-N: use ORDER BY + LIMIT N.
- Query timeout: 2 seconds.

## How to Respond
- Answer directly. Match depth to the question — 1–2 sentences for simple lookups, real analysis for complex ones.
- Cite inline when using query data: "You hit 12 sets this week [q1]." Every specific number needs a citation.
- Interpret the data like a coach reviewing film. A plateau isn't just "volume was flat" — say what's stalling and what to adjust. A PR isn't just "weight went up" — say whether the rate of progress is on track or needs to accelerate. Connect the numbers to what they mean for long-term adaptation.
- If data is missing or a query fails, say what's missing and what would be needed to answer properly.
- Call execute_gym_query only when you need actual data. General fitness and programming questions don't need a query.
- For questions needing multiple metrics, include them as multiple queries in one tool call.
- This is a gym and fitness assistant. For questions unrelated to fitness or training, briefly say so.
- When the user asks for a chart ("show me a chart", "give me a bar chart", etc.), keep the text response to 1-2 sentences max. The chart renders automatically — do not narrate data that is already visible in the chart.

## Conversation
You have full conversation history — use it. References like "that exercise" or "last session" resolve from context. If something is genuinely ambiguous and context doesn't help, ask one short question. Otherwise pick the most reasonable interpretation and proceed.

Timezone: ${timezone}`
}

const normalizeConversationState = (value: unknown): GymChatConversationState => {
  if (!value || typeof value !== 'object') return {}
  const state = value as GymChatConversationState
  const messages = Array.isArray(state.messages)
    ? state.messages.filter(entry => entry && entry.role && typeof entry.content === 'string')
    : undefined
  const sessionId = typeof state.sessionId === 'string' ? state.sessionId : undefined
  return { sessionId, messages }
}

const buildConversationMessages = (history: GymChatConversationState['messages']): OpenAIMessage[] => {
  if (!history?.length) return []
  return history
    .filter(entry => entry.role === 'user' || entry.role === 'assistant' || entry.role === 'tool')
    .map(entry => ({
      role: entry.role,
      content: entry.content,
      tool_call_id: entry.tool_call_id,
      tool_calls: entry.tool_calls,
    }))
}

const trimConversationMessages = (messages: OpenAIMessage[]) => {
  const withoutSystem = messages.filter(m => m.role !== 'system')
  if (withoutSystem.length <= 50) return withoutSystem
  const head = withoutSystem.slice(0, 2)
  const dropped = withoutSystem.slice(2, -46)
  const tail = withoutSystem.slice(-46)
  const droppedTopics = dropped
    .filter(m => m.role === 'user' && typeof m.content === 'string' && !m.content.startsWith('['))
    .map(m => (m.content as string).trim().slice(0, 80))
    .slice(0, 5)
  if (!droppedTopics.length) return [...head, ...tail]
  const bridge: OpenAIMessage = {
    role: 'user',
    content: `[Earlier conversation trimmed. Topics covered: ${droppedTopics.join('; ')}]`,
  }
  return [...head, bridge, ...tail]
}

const executeToolCall = async (
  queries: Array<{ id: string; purpose: string; sql: string; params: unknown[] }>,
  connection: { url: string; fallback: boolean } | null,
): Promise<GymChatQuery[]> => {
  const executed: GymChatQuery[] = []
  if (!queries.length) return executed

  if (!connection) {
    for (const query of queries) {
      executed.push({
        id: query.id,
        purpose: query.purpose,
        sql: query.sql,
        params: query.params ?? [],
        rowCount: 0,
        durationMs: 0,
        previewRows: [],
        error: 'Missing read-only database connection.',
      })
    }
    return executed
  }

  if (connection.fallback) {
    console.warn('GYM_CHAT_DATABASE_URL_READONLY missing; falling back to default connection in development.')
  }

  const usePool = connection.url.includes('-pooler.')
  const runWithClient = async (client: Queryable) => {
    for (const query of queries) {
      try {
        const policy = validateAndRewriteSql(query.sql, query.params ?? [])
        const result = await executeQuery(client, policy.sql, policy.params)
        executed.push({
          id: query.id,
          purpose: query.purpose,
          sql: policy.sql,
          params: policy.params,
          rowCount: result.rowCount,
          durationMs: result.durationMs,
          previewRows: result.rows.slice(0, MAX_PREVIEW_ROWS),
          error: 'error' in result && result.error ? result.error : null,
          policy: {
            appliedLimit: policy.appliedLimit,
            appliedTimeWindow: policy.appliedTimeWindow,
          },
        })
      } catch (error) {
        executed.push({
          id: query.id,
          purpose: query.purpose,
          sql: query.sql,
          params: query.params ?? [],
          rowCount: 0,
          durationMs: 0,
          previewRows: [],
          error: error instanceof Error ? error.message : 'Query validation failed.',
          policy: undefined,
        })
      }
    }
  }

  if (usePool) {
    const pool = createPool({ connectionString: connection.url })
    const client = await pool.connect()
    try {
      await client.query(`SET statement_timeout = ${QUERY_TIMEOUT_MS}`)
      await client.query('SET default_transaction_read_only = on')
      await runWithClient(client)
    } finally {
      client.release()
      await pool.end()
    }
    return executed
  }

  const client = createClient({ connectionString: connection.url })
  await client.connect()
  try {
    await client.query(`SET statement_timeout = ${QUERY_TIMEOUT_MS}`)
    await client.query('SET default_transaction_read_only = on')
    await runWithClient(client)
  } finally {
    await client.end()
  }

  return executed
}

export async function POST(req: Request) {
  const requestIdHeader = req.headers.get('x-request-id')?.trim()
  const requestId =
    requestIdHeader && requestIdHeader.length <= 128 ? requestIdHeader : randomUUID()
  const startedAt = Date.now()
  const wantsStream =
    req.headers.get('accept')?.includes('text/event-stream') || req.headers.get('x-stream') === '1'

  const encoder = new TextEncoder()
  const pendingEvents: string[] = []
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null
  let shouldCloseStream = false

  const enqueueEvent = (payload: string) => {
    if (streamController) {
      streamController.enqueue(encoder.encode(payload))
      return
    }
    pendingEvents.push(payload)
  }

  const sendEvent = (event: string, data: unknown) => {
    if (!wantsStream) return
    enqueueEvent(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  const sendStatus = (stage: string, message: string) => {
    sendEvent('status', { stage, message, elapsedMs: Date.now() - startedAt })
  }

  const sendError = (message: string, type: string, detail?: string) => {
    sendEvent('error', { type, message, detail, elapsedMs: Date.now() - startedAt })
    if (streamController) {
      streamController.close()
      streamController = null
    } else {
      shouldCloseStream = true
    }
  }

  const sendFinal = (payload: unknown) => {
    sendEvent('final', payload)
    if (streamController) {
      streamController.close()
      streamController = null
    } else {
      shouldCloseStream = true
    }
  }

  const resolveErrorType = (status?: number) => {
    if (!status) return 'unknown'
    if (status === 503) return 'upstream'
    if (status === 504) return 'timeout'
    if (status >= 500) return 'internal'
    if (status >= 400) return 'bad_request'
    return 'unknown'
  }

  const llmRetryBudget = {
    remainingMs: () => Math.max(0, MAX_DURATION_MS - (Date.now() - startedAt)),
    minRetryWindowMs: MIN_LLM_RETRY_WINDOW_MS,
  }

  const respond = (body: GymChatResponse, init?: { status?: number }) => {
    if (wantsStream) {
      const status = init?.status
      if (status && status >= 400) {
        sendError(body.assistantMessage, resolveErrorType(status))
      } else {
        sendFinal(body)
      }
      return undefined
    }
    const headers = { 'x-request-id': requestId }
    return NextResponse.json(body, { ...(init ?? {}), headers })
  }

  const respondError = (message: string, status = 500) =>
    respond(
      {
        assistantMessage: message,
        citations: [],
        queries: [],
      },
      { status },
    )

  const run = async () => {
    sendStatus('started', 'Starting request...')

    let payload: {
      messages?: GymChatMessage[]
      client?: { timezone?: string }
      conversationState?: GymChatConversationState | null
    }
    try {
      payload = (await req.json()) as {
        messages?: GymChatMessage[]
        client?: { timezone?: string }
        conversationState?: GymChatConversationState | null
      }
    } catch {
      return respondError('Invalid request payload.', 400)
    }

    const clientMessages = normalizeMessages(payload.messages ?? [])
    const question = extractLatestUserQuestion(clientMessages)
    if (!question) {
      return respondError('Missing user question.', 400)
    }

    const timezone = payload.client?.timezone ?? 'UTC'

    sendStatus('catalog', 'Loading workout catalog...')
    await Promise.all([loadGymCatalog(), loadBodyParts()]).catch(() => undefined)

    const systemPrompt = buildSystemPrompt(timezone)
    const conversationState = normalizeConversationState(payload.conversationState)
    const history = buildConversationMessages(conversationState.messages)
    const openaiMessages: OpenAIMessage[] = [...history, { role: 'user', content: question }]

    const connection = resolveReadonlyConnection()

    try {
      const result = await runGymChatConversation({
        systemPrompt,
        messages: openaiMessages,
        tools: [EXECUTE_GYM_QUERY_TOOL],
        executeQueries: async queries => {
          const results = await executeToolCall(queries, connection)
          for (const result of results) {
            if (result.rowCount === 0 && !result.error && result.params?.length) {
              for (const param of result.params) {
                if (typeof param !== 'string' || param.length < 2) continue
                const stripped = param.replace(/%/g, '').trim()
                if (stripped.length < 2) continue
                const suggestions = suggestExerciseNames(stripped)
                if (suggestions.length) {
                  result.exerciseSuggestions = suggestions
                  break
                }
              }
            }
          }
          return { queries: results }
        },
        onStatus: sendStatus,
        options: { budget: llmRetryBudget },
      })

      const updatedState: GymChatConversationState = {
        sessionId: conversationState.sessionId ?? randomUUID(),
        messages: trimConversationMessages(openaiMessages).map(message => ({
          role: message.role === 'system' ? 'assistant' : message.role,
          content: message.content ?? '',
          tool_call_id: message.tool_call_id,
          tool_calls: message.tool_calls,
        })),
      }

      const response: GymChatResponse = {
        assistantMessage: result.assistantMessage,
        citations: result.citations,
        queries: result.queries,
        chartSpecs: result.chartSpecs,
        followUps: result.followUps,
        conversationState: updatedState,
      }

      return respond(response)
    } catch (error) {
      if (isLlmRequestError(error)) {
        return respondError(error.message, error.status ?? 502)
      }
      const message = error instanceof Error ? error.message : 'Request failed.'
      return respondError(message, 500)
    }
  }

  if (!wantsStream) {
    return run()
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller
      if (pendingEvents.length) {
        for (const payload of pendingEvents) {
          controller.enqueue(encoder.encode(payload))
        }
        pendingEvents.length = 0
      }
      if (shouldCloseStream) {
        controller.close()
        streamController = null
        return
      }
      void run().catch(error => {
        const message = error instanceof Error ? error.message : 'Request failed.'
        sendError(message, resolveErrorType(500))
      })
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-request-id': requestId,
    },
  })
}
