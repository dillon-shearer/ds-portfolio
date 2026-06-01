// app/koreader-remote/RemotePanel.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './RemotePanel.module.css'
import { RemoteButton } from './RemoteButton'
import { StatusBar, type StatusTone } from './StatusBar'
import { SetupModal } from './SetupModal'
import { SwipeShell } from './SwipeShell'
import { useKoreaderEndpoint } from './hooks/use-koreader-endpoint'
import { useScreenWakeLock } from './hooks/use-screen-wake-lock'
import {
  KOREADER_ACTIONS,
  prefetchKoreaderConnection,
  sendKoreaderCommand,
  warmKoreaderEndpoint,
  type KoreaderActionId,
} from '@/lib/koreader/client'

type Status = {
  tone: StatusTone
  message: string
  detail?: string
}

const QUICK_ATTEMPTS = 3
const QUICK_DELAY_MS = 250
const FALLBACK_DELAY_MS = 3000
const QUEUE_SPACING_MS = 150

export function RemotePanel() {
  const endpoint = useKoreaderEndpoint()
  useScreenWakeLock(true)

  const [status, setStatus] = useState<Status>({
    tone: 'idle',
    message: 'Loading',
  })
  const [activeAction, setActiveAction] = useState<KoreaderActionId | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const queueRef = useRef<KoreaderActionId[]>([])
  const processingRef = useRef(false)
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Open the modal automatically when there is no endpoint yet.
  useEffect(() => {
    if (!endpoint.isReady) return
    if (!endpoint.hasEndpoint) {
      setIsPanelOpen(true)
      setStatus({
        tone: 'idle',
        message: 'Configure endpoint to start',
      })
    }
  }, [endpoint.isReady, endpoint.hasEndpoint])

  // Connection probe loop: 3 quick probes then 3s polling until success.
  useEffect(() => {
    if (!endpoint.isReady || !endpoint.hasEndpoint) return

    let cancelled = false
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null

    const detail = endpoint.endpoint

    setStatus({ tone: 'pending', message: 'Connecting', detail })

    async function quickProbes(): Promise<boolean> {
      for (let i = 0; i < QUICK_ATTEMPTS; i += 1) {
        const result = await warmKoreaderEndpoint(endpoint.endpoint)
        if (cancelled) return false
        if (result.ok) {
          setStatus({ tone: 'idle', message: 'Ready', detail })
          return true
        }
        await new Promise((r) => setTimeout(r, QUICK_DELAY_MS))
      }
      return false
    }

    async function pollUntilConnected() {
      const tick = async () => {
        if (cancelled) return
        const result = await warmKoreaderEndpoint(endpoint.endpoint)
        if (cancelled) return
        if (result.ok) {
          setStatus({ tone: 'idle', message: 'Ready', detail })
          return
        }
        fallbackTimer = setTimeout(tick, FALLBACK_DELAY_MS)
      }
      void tick()
    }

    void quickProbes().then((ok) => {
      if (cancelled || ok) return
      void pollUntilConnected()
    })

    return () => {
      cancelled = true
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [endpoint.isReady, endpoint.hasEndpoint, endpoint.endpoint])

  const schedulePrefetch = useCallback(
    (action: KoreaderActionId) => {
      if (!endpoint.endpoint) return
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current)
      const delay = action === 'next' ? 125 : 175
      prefetchTimerRef.current = setTimeout(() => {
        prefetchTimerRef.current = null
        void prefetchKoreaderConnection(endpoint.endpoint)
      }, delay)
    },
    [endpoint.endpoint],
  )

  const processQueue = useCallback(async () => {
    if (processingRef.current) return
    processingRef.current = true
    try {
      while (queueRef.current.length > 0) {
        const actionId = queueRef.current.shift()!
        if (!endpoint.hasEndpoint) {
          setStatus({
            tone: 'error',
            message: 'No endpoint configured',
            detail: 'Open setup to add your KOReader IP and port.',
          })
          continue
        }
        const action = KOREADER_ACTIONS[actionId]
        setActiveAction(actionId)
        setStatus({ tone: 'pending', message: `Sending ${action.label}` })
        const result = await sendKoreaderCommand(endpoint.endpoint, actionId)
        setActiveAction(null)
        if (result.ok) {
          setStatus({ tone: 'success', message: `${action.label} sent` })
          schedulePrefetch(actionId)
        } else {
          setStatus({
            tone: 'error',
            message: `Unable to send ${action.label}`,
            detail: result.error,
          })
          queueRef.current = []
          break
        }
        await new Promise((r) => setTimeout(r, QUEUE_SPACING_MS))
      }
    } finally {
      processingRef.current = false
    }
  }, [endpoint.endpoint, endpoint.hasEndpoint, schedulePrefetch])

  const enqueue = useCallback(
    (actionId: KoreaderActionId) => {
      queueRef.current.push(actionId)
      void processQueue()
    },
    [processQueue],
  )

  // Swipe shell dispatches koreader-swipe on window; convert to a queued action.
  useEffect(() => {
    function handleSwipe(event: Event) {
      const custom = event as CustomEvent<{ action: KoreaderActionId }>
      if (!custom.detail?.action) return
      enqueue(custom.detail.action)
    }
    window.addEventListener('koreader-swipe', handleSwipe as EventListener)
    return () =>
      window.removeEventListener('koreader-swipe', handleSwipe as EventListener)
  }, [enqueue])

  useEffect(
    () => () => {
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current)
    },
    [],
  )

  const disabled = !endpoint.hasEndpoint || activeAction !== null

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>KOReader Remote</h1>
        <button
          type="button"
          className={styles.setupButton}
          onClick={() => setIsPanelOpen(true)}
          aria-label="Open setup"
        >
          ⚙
        </button>
      </header>

      <SwipeShell>
        <div className={styles.grid}>
          <RemoteButton
            action="prev"
            label="Prev"
            hint="swipe ←"
            pressed={activeAction === 'prev'}
            disabled={disabled}
            onPress={() => enqueue('prev')}
          />
          <RemoteButton
            action="next"
            label="Next"
            hint="swipe →"
            pressed={activeAction === 'next'}
            disabled={disabled}
            onPress={() => enqueue('next')}
          />
        </div>
      </SwipeShell>

      <StatusBar tone={status.tone} message={status.message} detail={status.detail} />

      <SetupModal
        open={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        endpoint={endpoint}
      />
    </div>
  )
}
