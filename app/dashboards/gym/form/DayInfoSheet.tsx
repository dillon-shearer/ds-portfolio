'use client'

import { useEffect } from 'react'
import styles from './DayInfoSheet.module.css'

type Props = {
  open: boolean
  onClose: () => void
  date: string
  onDateChange: (date: string) => void
  dayTag: string
  onDayTagChange: (tag: string) => void
  defaultDayTags: string[]
  onSave: () => void
}

export default function DayInfoSheet({
  open,
  onClose,
  date,
  onDateChange,
  dayTag,
  onDayTagChange,
  defaultDayTags,
  onSave,
}: Props) {
  useEffect(() => {
    const el = document.documentElement
    const prev = el.style.overflow
    if (open) el.style.overflow = 'hidden'
    return () => { el.style.overflow = prev }
  }, [open])

  if (!open) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Day Information">
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.header}>
          <h3 className={styles.title}>Day Information</h3>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <form
          className={styles.body}
          onSubmit={(e) => {
            e.preventDefault()
            onSave()
          }}
        >
          <div className={styles.field}>
            <label htmlFor="day-info-date" className={styles.label}>Date *</label>
            <input
              id="day-info-date"
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Workout Day (optional)</label>
            <div className={styles.tagRow}>
              {defaultDayTags.map((t) => {
                const active = dayTag.trim().toLowerCase() === t.toLowerCase()
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onDayTagChange(t)}
                    className={[styles.tag, active ? styles.tagActive : ''].join(' ')}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          <button type="submit" className={styles.save}>
            Save
          </button>
        </form>
      </div>
    </div>
  )
}
