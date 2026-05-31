// app/koreader-remote/StatusBar.tsx
'use client'

import styles from './StatusBar.module.css'

export type StatusTone = 'idle' | 'pending' | 'success' | 'error'

type Props = {
  tone: StatusTone
  message: string
  detail?: string
}

const GLYPHS: Record<StatusTone, string> = {
  idle: '▸',
  pending: '◌',
  success: '✓',
  error: '!',
}

const TONE_CLASS: Record<StatusTone, string> = {
  idle: styles.toneIdle,
  pending: styles.tonePending,
  success: styles.toneSuccess,
  error: styles.toneError,
}

export function StatusBar({ tone, message, detail }: Props) {
  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <span className={`${styles.glyph} ${TONE_CLASS[tone]}`}>{GLYPHS[tone]}</span>
      <span className={styles.message}>{message}</span>
      {detail ? (
        <>
          <span className={styles.divider}>·</span>
          <span className={styles.detail}>{detail}</span>
        </>
      ) : null}
    </div>
  )
}
