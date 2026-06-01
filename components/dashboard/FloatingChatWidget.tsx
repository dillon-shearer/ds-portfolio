'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import styles from './FloatingChatWidget.module.css'
import type {
  GymChatCitation,
  GymChatChartSpec,
  GymChatConversationState,
  GymChatMessage,
  GymChatQuery,
  GymChatResponse,
  GymChatTimeWindow,
} from '@/types/gym-chat'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ChatMessage = {
  id: string
  role: GymChatMessage['role']
  content: string
  createdAt: string
  queries?: GymChatQuery[]
  citations?: GymChatCitation[]
  chartSpecs?: GymChatChartSpec[]
  followUps?: string[]
  retryPayload?: string
  retryRequestId?: string
}

type Props = {
  apiEndpoint: string
}

const SUGGESTED_QUESTIONS = [
  'What was my weekly training volume over the last 12 months?',
  'How many sessions did I log in the last 8 weeks?',
  'Which exercises had the most total sets in the last 90 days?',
  'Show my top 5 highest-weight sets from the last 90 days.',
]

const createMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const buildTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const CITATION_REGEX = /\[([a-zA-Z0-9_-]+)\](?!\()/g

const mergeConversationState = (
  prev: GymChatConversationState,
  incoming?: GymChatConversationState | null,
): GymChatConversationState => {
  if (!incoming) return prev
  if (prev.sessionId && incoming.sessionId && prev.sessionId !== incoming.sessionId) {
    return incoming
  }
  return { ...prev, ...incoming }
}

const readEventStream = async (
  response: Response,
  onEvent: (event: { event: string; data: unknown }) => void,
) => {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Streaming response missing body.')
  }
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let boundaryMatch = buffer.match(/\r?\n\r?\n/)
    while (boundaryMatch) {
      const boundaryIndex = boundaryMatch.index ?? 0
      const boundaryLength = boundaryMatch[0].length
      const chunk = buffer.slice(0, boundaryIndex)
      buffer = buffer.slice(boundaryIndex + boundaryLength)
      if (!chunk.trim()) {
        boundaryMatch = buffer.match(/\r?\n\r?\n/)
        continue
      }
      const lines = chunk.split(/\r?\n/)
      let event = 'message'
      const dataLines: string[] = []
      for (const line of lines) {
        if (line.startsWith('event:')) {
          event = line.slice(6).trim()
          continue
        }
        if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim())
        }
      }
      if (dataLines.length) {
        const dataText = dataLines.join('\n')
        let data: unknown
        try {
          data = JSON.parse(dataText)
        } catch {
          data = dataText
        }
        onEvent({ event, data })
      }
      boundaryMatch = buffer.match(/\r?\n\r?\n/)
    }
  }
}

const formatContentWithCitations = (content: string, queryIds: Set<string>, anchorPrefix: string) => {
  if (!queryIds.size) return content
  return content.replace(CITATION_REGEX, (match, marker) => {
    if (!queryIds.has(marker)) return match
    return `[\\[${marker}\\]](#${anchorPrefix}${marker})`
  })
}

const buildMarkdownComponents = (): Components => ({
  h1: ({ ...props }) => (
    <h1 className={styles.mdH1} {...props} />
  ),
  h2: ({ ...props }) => (
    <h2 className={styles.mdH2} {...props} />
  ),
  h3: ({ ...props }) => (
    <h3 className={styles.mdH3} {...props} />
  ),
  p: ({ ...props }) => (
    <p className={styles.mdP} {...props} />
  ),
  ul: ({ ...props }) => (
    <ul className={styles.mdUl} {...props} />
  ),
  ol: ({ ...props }) => (
    <ol className={styles.mdOl} {...props} />
  ),
  li: ({ ...props }) => (
    <li className={styles.mdLi} {...props} />
  ),
  strong: ({ ...props }) => <strong className={styles.mdStrong} {...props} />,
  em: ({ ...props }) => <em className={styles.mdEm} {...props} />,
  code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) => {
    const isBlock = !!className || String(children).includes('\n')
    return isBlock ? (
      <pre className={styles.mdPre}><code className={className} {...props}>{children}</code></pre>
    ) : (
      <code className={styles.mdCodeInline} {...props}>{children}</code>
    )
  },
  blockquote: ({ ...props }) => (
    <blockquote className={styles.mdBlockquote} {...props} />
  ),
  a: ({ children, href = '', ...props }: React.ComponentPropsWithoutRef<'a'>) => {
    const safeHref = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')
      ? href
      : '#'
    return (
      <a href={safeHref} target="_blank" rel="noreferrer" className={styles.mdLink} {...props}>
        {children}
      </a>
    )
  },
  table: ({ ...props }) => (
    <div className={styles.mdTableWrapper}>
      <table className={styles.mdTable} {...props} />
    </div>
  ),
})

const MD_COMPONENTS = buildMarkdownComponents()

const MarkdownContent = ({
  content,
  queryIds,
  anchorPrefix,
}: {
  content: string
  queryIds: Set<string>
  anchorPrefix: string
}) => {
  const formatted = formatContentWithCitations(content, queryIds, anchorPrefix)
  return (
    <ReactMarkdown components={MD_COMPONENTS}>
      {formatted}
    </ReactMarkdown>
  )
}

const formatPolicyWindow = (value: GymChatTimeWindow | null | undefined) => {
  if (value === 'all_time') return 'all time'
  if (!value) return 'not applied'
  return value
}

const renderPreviewTable = (rows: Record<string, unknown>[]) => {
  if (!rows.length) {
    return <p className={styles.noRows}>No rows returned.</p>
  }
  const headers = Object.keys(rows[0])
  return (
    <div className={styles.previewTableWrapper}>
      <table className={styles.previewTable}>
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header} className={styles.previewTh}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`row-${idx}`} className={styles.previewTr}>
              {headers.map(header => (
                <td key={`${idx}-${header}`} className={styles.previewTd}>
                  {row[header] == null ? '-' : String(row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ChatChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: unknown }>; label?: unknown }) {
  if (!active || !payload?.length) return null
  const raw = payload[0]?.value
  const value = typeof raw === 'number' ? raw.toLocaleString() : String(raw ?? '')
  const labelStr = label != null ? String(label) : ''
  return (
    <div style={{
      background: 'var(--color-ink)',
      color: 'var(--color-paper)',
      padding: 'var(--space-2) var(--space-3)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      whiteSpace: 'nowrap',
    }}>
      {labelStr && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-rule)' }}>{labelStr}</span>}
      <span style={{ fontWeight: 500, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>{value}</span>
    </div>
  )
}

const AXIS_TICK = { fill: 'var(--color-ink-3)', fontSize: 10, fontFamily: 'var(--font-sans)' }

const renderCharts = (chartSpecs: GymChatChartSpec[] | undefined, queries: GymChatQuery[] | undefined) => {
  if (!chartSpecs?.length || !queries?.length) return null
  const queryById = new Map(queries.map(q => [q.id, q]))
  return (
    <div className={styles.chartsWrapper}>
      {chartSpecs.map(spec => {
        const query = queryById.get(spec.queryId)
        if (!query?.previewRows?.length) return null
        const data = query.previewRows
          .map(row => {
            const xVal = row[spec.x]
            const yVal = Number(row[spec.y])
            if (xVal == null || Number.isNaN(yVal)) return null
            return { x: xVal, y: yVal }
          })
          .filter(Boolean) as Array<{ x: unknown; y: number }>
        if (!data.length) return null
        return (
          <div key={`chart-${spec.queryId}-${spec.x}-${spec.y}`} className={styles.chartCard}>
            <div className={styles.chartTitle}>{spec.title || 'Chart'}</div>
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%" minWidth={180} minHeight={150}>
                {spec.type === 'bar' ? (
                  <BarChart data={data}>
                    <CartesianGrid stroke="var(--color-rule-soft)" strokeOpacity={0.5} />
                    <XAxis dataKey="x" tick={AXIS_TICK} stroke="var(--color-rule)" tickLine={false} />
                    <YAxis tick={AXIS_TICK} stroke="var(--color-rule)" />
                    <Tooltip content={<ChatChartTooltip />} cursor={{ fill: 'var(--color-rule-soft)' }} />
                    <Bar dataKey="y" fill="var(--chart-primary)" />
                  </BarChart>
                ) : (
                  <LineChart data={data}>
                    <CartesianGrid stroke="var(--color-rule-soft)" strokeOpacity={0.5} />
                    <XAxis dataKey="x" tick={AXIS_TICK} stroke="var(--color-rule)" tickLine={false} />
                    <YAxis tick={AXIS_TICK} stroke="var(--color-rule)" />
                    <Tooltip content={<ChatChartTooltip />} cursor={{ stroke: 'var(--color-accent)', strokeOpacity: 0.3 }} />
                    <Line type="monotone" dataKey="y" stroke="var(--chart-primary)" strokeWidth={2} dot={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const QueryDetails = ({ queries, anchorPrefix }: { queries?: GymChatQuery[]; anchorPrefix: string }) => {
  if (!queries?.length) return null
  return (
    <details className={styles.queryDetails}>
      <summary className={styles.queryDetailsSummary}>Query details</summary>
      <div className={styles.queryList}>
        {queries.map(query => (
          <div key={query.id} id={`${anchorPrefix}${query.id}`} className={styles.queryCard}>
            <div className={styles.queryCardHeader}>
              <div>
                <div className={styles.queryId}>{query.id}</div>
                <div className={styles.queryPurpose}>{query.purpose}</div>
              </div>
              <div className={styles.queryMeta}>
                {query.error ? 'Error' : `${query.rowCount} rows`} · {query.durationMs}ms
              </div>
            </div>
            {query.error ? (
              <div className={styles.queryError}>{query.error}</div>
            ) : null}
            <div className={styles.queryParams}>Params: {JSON.stringify(query.params)}</div>
            {query.policy ? (
              <div className={styles.queryPolicy}>
                Policy: limit {query.policy.appliedLimit} rows · window {formatPolicyWindow(query.policy.appliedTimeWindow)}
              </div>
            ) : null}
            <details className={styles.sqlDetails}>
              <summary className={styles.sqlSummary}>Show SQL</summary>
              <pre className={styles.sqlPre}>{query.sql}</pre>
            </details>
            <div className={styles.previewSection}>{renderPreviewTable(query.previewRows)}</div>
          </div>
        ))}
      </div>
    </details>
  )
}

export default function FloatingChatWidget({ apiEndpoint }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [scrollPosition, setScrollPosition] = useState<'top' | 'middle' | 'bottom'>('bottom')
  const [conversationState, setConversationState] = useState<GymChatConversationState>({})
  const [panelSize, setPanelSize] = useState<{ width: number; height: number } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const lastAssistantMessageIdRef = useRef<string | null>(null)
  const inputRef = useRef('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { abortControllerRef.current?.abort() }
  }, [])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('gym-chat-panel-size')
      if (!saved) return
      const parsed = JSON.parse(saved) as { width?: unknown; height?: unknown }
      if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
        setPanelSize({ width: parsed.width, height: parsed.height })
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!panelSize) return
    try {
      window.localStorage.setItem('gym-chat-panel-size', JSON.stringify(panelSize))
    } catch {}
  }, [panelSize])

  const startResize = (direction: 'top' | 'left' | 'corner') => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const panel = e.currentTarget.parentElement as HTMLElement | null
    if (!panel) return
    const startW = panel.offsetWidth
    const startH = panel.offsetHeight

    const onMove = (ev: PointerEvent) => {
      let nextW = startW
      let nextH = startH
      if (direction === 'left' || direction === 'corner') {
        nextW = startW + (startX - ev.clientX)
      }
      if (direction === 'top' || direction === 'corner') {
        nextH = startH + (startY - ev.clientY)
      }
      const maxW = Math.max(320, window.innerWidth - 48)
      const maxH = Math.max(360, window.innerHeight - 80)
      setPanelSize({
        width: Math.max(320, Math.min(maxW, nextW)),
        height: Math.max(360, Math.min(maxH, nextH)),
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const handleCopyMessage = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current)
      copyResetTimerRef.current = setTimeout(() => {
        setCopiedId(current => (current === id ? null : current))
      }, 1500)
    } catch {}
  }

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current)
    }
  }, [])

  useEffect(() => {
    inputRef.current = input
  }, [input])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '0px'
    const computed = window.getComputedStyle(textarea)
    const lineHeight = Number.parseFloat(computed.lineHeight || '20')
    const paddingTop = Number.parseFloat(computed.paddingTop || '0')
    const paddingBottom = Number.parseFloat(computed.paddingBottom || '0')
    const maxHeight = lineHeight * 4 + paddingTop + paddingBottom
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${nextHeight}px`
  }, [input])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: 0, behavior })
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const isNearTop = el.scrollTop < 80
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    setScrollPosition(isNearTop ? 'top' : isNearBottom ? 'bottom' : 'middle')
  }, [])

  useEffect(() => {
    handleScroll()
  }, [messages, handleScroll])

  useEffect(() => {
    const latestAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    if (!latestAssistant) {
      lastAssistantMessageIdRef.current = null
      return
    }
    if (lastAssistantMessageIdRef.current === latestAssistant.id) return
    lastAssistantMessageIdRef.current = latestAssistant.id
    scrollToBottom()
  }, [messages, scrollToBottom])

  const scrollToBottomSoon = useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      if (!scrollContainerRef.current) return
      requestAnimationFrame(() => scrollToBottom(behavior))
    },
    [scrollToBottom],
  )

  const handleSubmit = useCallback(
    async (overrideInput?: string, options?: { retryRequestId?: string }) => {
      const rawInput = overrideInput ?? inputRef.current
      const trimmed = rawInput.trim()
      if (!trimmed || isLoading) return

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      }
      const assistantMessageId = createMessageId()
      const assistantPlaceholder: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      }
      const outgoingMessages = [...messages, userMessage]
      const nextMessages = [...outgoingMessages, assistantPlaceholder]
      setMessages(nextMessages)
      setInput('')
      setIsLoading(true)
      scrollToBottomSoon('auto')

      const updateAssistantMessage = (patch: Partial<ChatMessage>) => {
        setMessages(current =>
          current.map(m => (m.id === assistantMessageId ? { ...m, ...patch } : m)),
        )
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined
      let finalReceived = false
      let effectiveRequestId: string | undefined
      try {
        const controller = new AbortController()
        abortControllerRef.current = controller
        const timeoutMs = 60000
        const headers: Record<string, string> = {
          'content-type': 'application/json',
          accept: 'text/event-stream',
          'x-stream': '1',
        }
        if (options?.retryRequestId) {
          headers['x-request-id'] = options.retryRequestId
        }
        const fetchPromise = fetch(apiEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: outgoingMessages.map(m => ({ role: m.role, content: m.content })),
            client: { timezone: buildTimezone() },
            conversationState,
          }),
          signal: controller.signal,
        })
        const timeoutPromise = new Promise<never>((_resolve, reject) => {
          timeoutId = setTimeout(() => {
            controller.abort()
            reject(new Error('This is taking longer than usual. Please try again.'))
          }, timeoutMs)
        })
        const res = (await Promise.race([fetchPromise, timeoutPromise])) as Response
        const requestId = res.headers.get('x-request-id') || undefined
        effectiveRequestId = requestId ?? options?.retryRequestId

        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('text/event-stream')) {
          await readEventStream(res, event => {
            if (event.event === 'status') return
            if (event.event === 'final') {
              finalReceived = true
              const data = event.data as GymChatResponse
              const assistantMessage =
                data && typeof data.assistantMessage === 'string'
                  ? data.assistantMessage
                  : 'Response completed without content.'
              updateAssistantMessage({
                content: assistantMessage,
                queries: data?.queries,
                citations: data?.citations,
                chartSpecs: data?.chartSpecs,
                followUps: data?.followUps,
                retryPayload: undefined,
                retryRequestId: undefined,
              })
              if (data?.conversationState) {
                setConversationState(prev => mergeConversationState(prev, data.conversationState))
              }
              return
            }
            if (event.event === 'error') {
              finalReceived = true
              const message =
                event.data && typeof (event.data as Record<string, unknown>).message === 'string'
                  ? (event.data as Record<string, unknown>).message as string
                  : 'Request failed.'
              updateAssistantMessage({
                content: message,
                retryPayload: trimmed,
                retryRequestId: effectiveRequestId,
              })
            }
          })
          if (!finalReceived) {
            updateAssistantMessage({
              content: 'The response stopped early. Please retry your last message.',
              retryPayload: trimmed,
              retryRequestId: effectiveRequestId,
            })
          }
          return
        }

        const data = (await res.json()) as GymChatResponse
        if (!res.ok) {
          throw new Error(data?.assistantMessage || 'Request failed.')
        }
        finalReceived = true
        setConversationState(prev => mergeConversationState(prev, data.conversationState))
        updateAssistantMessage({
          content: data.assistantMessage,
          queries: data.queries,
          citations: data.citations,
          chartSpecs: data.chartSpecs,
          followUps: data.followUps,
          retryPayload: undefined,
          retryRequestId: undefined,
        })
      } catch (error) {
        updateAssistantMessage({
          content: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
          retryPayload: trimmed,
          retryRequestId: effectiveRequestId ?? options?.retryRequestId,
        })
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        setIsLoading(false)
      }
    },
    [isLoading, messages, conversationState, scrollToBottomSoon, apiEndpoint],
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  const handleSuggestedQuestion = useCallback(
    (question: string) => {
      if (isLoading) return
      void handleSubmit(question)
    },
    [handleSubmit, isLoading],
  )

  const renderedMessages = useMemo(() => {
    return messages.map(message => {
      const anchorPrefix = `query-${message.id}-`
      const queryIds =
        message.role === 'assistant'
          ? new Set(message.queries?.map(q => q.id) ?? [])
          : new Set<string>()
      const isStatusMessage =
        message.role === 'assistant' &&
        !message.queries?.length &&
        !message.chartSpecs?.length &&
        !message.retryPayload &&
        message.content.trim().length === 0
      if (isStatusMessage) return null
      const copyButton = message.content.trim().length > 0 ? (
        <button
          type="button"
          className={[
            styles.copyBtn,
            copiedId === message.id ? styles.copyBtnCopied : '',
          ].join(' ').trim()}
          onClick={() => void handleCopyMessage(message.id, message.content)}
          aria-label={copiedId === message.id ? 'Copied' : 'Copy message'}
          title={copiedId === message.id ? 'Copied' : 'Copy'}
        >
          {copiedId === message.id ? (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 10l4 4 6-8" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="7" y="3" width="10" height="12" rx="1" />
              <path d="M13 17H5a1 1 0 0 1-1-1V6" />
            </svg>
          )}
        </button>
      ) : null

      return (
        <div
          key={message.id}
          className={message.role === 'user' ? styles.msgRowUser : styles.msgRowAssistant}
        >
          <div
            className={[
              styles.message,
              message.role === 'user' ? styles.messageUser : styles.messageAssistant,
            ].join(' ')}
          >
            <MarkdownContent
              content={message.content}
              queryIds={queryIds}
              anchorPrefix={anchorPrefix}
            />
            {message.role === 'assistant' && (
              <div className={styles.assistantExtras}>
                {renderCharts(message.chartSpecs, message.queries)}
                <QueryDetails queries={message.queries} anchorPrefix={anchorPrefix} />
                {message.retryPayload ? (
                  <div className={styles.retryBox}>
                    <div className={styles.retryLabel}>Response interrupted</div>
                    <div className={styles.retryBody}>
                      <p className={styles.retryHint}>Retry the last message without losing context.</p>
                      <button
                        type="button"
                        onClick={() =>
                          void handleSubmit(message.retryPayload, { retryRequestId: message.retryRequestId })
                        }
                        disabled={isLoading}
                        className={styles.retryBtn}
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            {copyButton}
          </div>
        </div>
      )
    })
  }, [messages, handleSuggestedQuestion, handleSubmit, isLoading])

  const showStart = messages.length === 0

  return (
    <div className={styles.bubble}>
      {isOpen && (
        <div
          className={styles.panel}
          style={panelSize ? { width: panelSize.width, height: panelSize.height } : undefined}
        >
          {/* Resize handles */}
          <div
            className={styles.resizeHandleTop}
            onPointerDown={startResize('top')}
            aria-hidden="true"
          />
          <div
            className={styles.resizeHandleLeft}
            onPointerDown={startResize('left')}
            aria-hidden="true"
          />
          <div
            className={styles.resizeHandleCorner}
            onPointerDown={startResize('corner')}
            aria-hidden="true"
          />
          {/* Panel header */}
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Gym Chat</span>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setMessages([])
                setConversationState({})
              }}
              aria-label="Clear chat history"
              title="Clear"
            >
              Clear
            </button>
          </div>

          {/* Scroll area */}
          <div className={styles.messagesOuter}>
            {!showStart && scrollPosition !== 'top' && (
              <button
                type="button"
                onClick={() => scrollToTop()}
                aria-label="Scroll to top"
                className={styles.scrollBtn}
                style={{ top: 8 }}
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 6a1 1 0 0 1 .7.3l4 4a1 1 0 1 1-1.4 1.4L10 8.4l-3.3 3.3a1 1 0 1 1-1.4-1.4l4-4A1 1 0 0 1 10 6z" />
                </svg>
              </button>
            )}
            {!showStart && scrollPosition !== 'bottom' && (
              <button
                type="button"
                onClick={() => scrollToBottom()}
                aria-label="Scroll to bottom"
                className={styles.scrollBtn}
                style={{ bottom: 8 }}
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 14a1 1 0 0 1-.7-.3l-4-4a1 1 0 1 1 1.4-1.4l3.3 3.3 3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-.7.3z" />
                </svg>
              </button>
            )}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className={styles.messages}
            >
              {showStart ? (
                <div className={styles.startScreen}>
                  <p className={styles.startTitle}>Gym Chat</p>
                  <p className={styles.startSub}>Ask anything about your training data</p>
                  <div className={styles.suggestions}>
                    {SUGGESTED_QUESTIONS.map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSuggestedQuestion(q)}
                        className={styles.suggestionBtn}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.messageList}>
                  {renderedMessages}
                  {isLoading ? (
                    <div className={styles.msgRowAssistant}>
                      <div className={styles.typingIndicator}>
                        <span className={styles.typingDot} style={{ animationDelay: '0ms' }} />
                        <span className={styles.typingDot} style={{ animationDelay: '150ms' }} />
                        <span className={styles.typingDot} style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Input row */}
          <div className={styles.inputRow}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your training..."
              rows={1}
              className={styles.input}
            />
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className={styles.sendBtn}
            >
              Send
            </button>
          </div>
          <div className={styles.inputHint}>Enter to send - Shift+Enter for new line</div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={styles.trigger}
        aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}
