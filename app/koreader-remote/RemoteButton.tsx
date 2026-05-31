// app/koreader-remote/RemoteButton.tsx
'use client'

import styles from './RemoteButton.module.css'
import type { KoreaderActionId } from '@/lib/koreader/client'

type Props = {
  action: KoreaderActionId
  label: string
  hint?: string
  pressed?: boolean
  disabled?: boolean
  onPress: () => void
}

export function RemoteButton({
  action,
  label,
  hint,
  pressed = false,
  disabled = false,
  onPress,
}: Props) {
  return (
    <button
      type="button"
      data-action={action}
      className={`${styles.button} ${pressed ? styles.pressed : ''}`}
      disabled={disabled}
      onClick={onPress}
    >
      <span className={styles.label}>{label}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </button>
  )
}
