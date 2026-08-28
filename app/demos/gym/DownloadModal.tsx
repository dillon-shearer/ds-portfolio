'use client'

import { useEffect, useRef } from 'react'
import styles from './GymDashboard.module.css'

export type DownloadRange = 'current' | 'all'
export type DownloadFormat = 'json' | 'csv'

type Props = {
  open: boolean
  range: DownloadRange
  format: DownloadFormat
  downloadHref: string
  onClose: () => void
  onRangeChange: (range: DownloadRange) => void
  onFormatChange: (format: DownloadFormat) => void
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function DownloadModal({
  open,
  range,
  format,
  downloadHref,
  onClose,
  onRangeChange,
  onFormatChange,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) {
        event.preventDefault()
        dialog.focus()
        return
      }

      if (event.shiftKey) {
        if (document.activeElement === first || !dialog.contains(document.activeElement)) {
          event.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last || !dialog.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus()
      previouslyFocusedRef.current = null
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-dialog-title"
        aria-describedby="download-dialog-description"
        tabIndex={-1}
      >
        <div className={styles.modalHeader}>
          <h2 id="download-dialog-title" className={styles.modalTitle}>
            Download Dataset
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close download dialog"
          >
            &times;
          </button>
        </div>
        <div className={styles.modalBody}>
          <p id="download-dialog-description" className={styles.modalDescription}>
            Choose the range and file format for your gym data export.
          </p>
          <fieldset className={styles.modalFieldset}>
            <legend className={styles.modalLabel}>Range</legend>
            <div className={styles.modalRow}>
              <button
                type="button"
                className={[styles.modalOpt, range === 'current' ? styles.modalOptActive : ''].join(
                  ' ',
                )}
                onClick={() => onRangeChange('current')}
                aria-pressed={range === 'current'}
              >
                Current filter
              </button>
              <button
                type="button"
                className={[styles.modalOpt, range === 'all' ? styles.modalOptActive : ''].join(
                  ' ',
                )}
                onClick={() => onRangeChange('all')}
                aria-pressed={range === 'all'}
              >
                All time
              </button>
            </div>
          </fieldset>
          <fieldset className={styles.modalFieldset}>
            <legend className={styles.modalLabel}>Format</legend>
            <div className={styles.modalRow}>
              <button
                type="button"
                className={[styles.modalOpt, format === 'csv' ? styles.modalOptActive : ''].join(
                  ' ',
                )}
                onClick={() => onFormatChange('csv')}
                aria-pressed={format === 'csv'}
              >
                CSV
              </button>
              <button
                type="button"
                className={[styles.modalOpt, format === 'json' ? styles.modalOptActive : ''].join(
                  ' ',
                )}
                onClick={() => onFormatChange('json')}
                aria-pressed={format === 'json'}
              >
                JSON
              </button>
            </div>
          </fieldset>
        </div>
        <div className={styles.modalFooter}>
          <button type="button" className={styles.modalCancel} onClick={onClose}>
            Cancel
          </button>
          <a href={downloadHref} onClick={onClose} className={styles.modalDownload}>
            Download
          </a>
        </div>
      </div>
    </div>
  )
}
