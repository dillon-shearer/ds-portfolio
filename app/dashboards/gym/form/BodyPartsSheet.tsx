'use client'

import { useEffect } from 'react'
import { ALL_BODY_PARTS, type BodyPart } from '@/lib/gym/body-parts'
import styles from './BodyPartsSheet.module.css'

export { ALL_BODY_PARTS }
export type { BodyPart }

type Props = {
  open: boolean
  onClose: () => void
  selected: BodyPart[]
  onToggle: (bp: BodyPart) => void
  onSelectAll: () => void
  onClear: () => void
  onSave: () => void
}

export default function BodyPartsSheet({
  open,
  onClose,
  selected,
  onToggle,
  onSelectAll,
  onClear,
  onSave,
}: Props) {
  useEffect(() => {
    const el = document.documentElement
    const prev = el.style.overflow
    if (open) el.style.overflow = 'hidden'
    return () => {
      el.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Target Body Parts">
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.header}>
          <h3 className={styles.title}>Target Body Parts</h3>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.toolbar}>
            <div className={styles.hint}>Check the muscle groups you are targeting today.</div>
            <div className={styles.toolActions}>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={onSelectAll}
                title="Select all"
              >
                Select All
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={onClear}
                title="Clear selection"
              >
                Clear
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {ALL_BODY_PARTS.map((bp) => {
              const active = selected.includes(bp)
              return (
                <label
                  key={bp}
                  className={[styles.option, active ? styles.optionActive : ''].join(' ')}
                >
                  <span className={styles.optionLabel}>{bp}</span>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onToggle(bp)}
                    className={styles.checkbox}
                  />
                </label>
              )
            })}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.save} onClick={onSave}>
              Save Body Parts
            </button>
            <button type="button" className={styles.done} onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
