// app/koreader-remote/SetupModal.tsx
'use client'

import { useEffect, useState } from 'react'
import styles from './SetupModal.module.css'
import type { useKoreaderEndpoint } from './hooks/use-koreader-endpoint'

const INTRO_STORAGE_KEY = 'dwd:koreader:intro:v1'

type Props = {
  open: boolean
  onClose: () => void
  endpoint: ReturnType<typeof useKoreaderEndpoint>
}

export function SetupModal({ open, onClose, endpoint }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [introSeen, setIntroSeen] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIntroSeen(window.localStorage.getItem(INTRO_STORAGE_KEY) === 'seen')
  }, [])

  if (!open) return null

  function handleSave() {
    const result = endpoint.saveEndpoint()
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(INTRO_STORAGE_KEY, 'seen')
    }
    setIntroSeen(true)
    onClose()
  }

  function handleClose() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(INTRO_STORAGE_KEY, 'seen')
    }
    setIntroSeen(true)
    onClose()
  }

  return (
    <div className={styles.scrim} role="dialog" aria-modal="true" aria-label="KOReader setup">
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>KOReader endpoint</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close setup"
          >
            ×
          </button>
        </div>

        {!introSeen ? (
          <p className={styles.intro}>
            Point the remote at your KOReader HTTP Inspector. Same Wi-Fi only.
            The endpoint is stored only in this browser.
          </p>
        ) : null}

        <label className={styles.fieldLabel}>
          Endpoint
          <input
            className={styles.input}
            type="text"
            inputMode="url"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="192.168.1.67:8080"
            value={endpoint.inputValue}
            onChange={(e) => {
              endpoint.setInputValue(e.target.value)
              if (error) setError(null)
            }}
            disabled={!endpoint.isReady}
          />
        </label>

        {error ? <p className={styles.errorText}>{error}</p> : null}
        {!error && endpoint.savedAt ? (
          <p className={styles.savedText}>Saved to this browser.</p>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!endpoint.isReady}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
