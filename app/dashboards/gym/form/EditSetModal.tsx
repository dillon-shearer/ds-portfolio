'use client'

import { useEffect } from 'react'
import type { GymLift } from '@/app/dashboards/gym/actions'
import styles from './EditSetModal.module.css'

export const EQUIPMENT_OPTIONS = [
  'Smith Machine',
  'Cable Stack',
  'Machine',
  'Dumbbells',
  'Curl Bar',
  'Barbell',
] as const
export type Equipment = typeof EQUIPMENT_OPTIONS[number]

type Props = {
  lift: GymLift | null
  allExerciseOptions: string[]
  onChange: (lift: GymLift) => void
  onSave: () => void
  onClose: () => void
}

export default function EditSetModal({
  lift,
  allExerciseOptions,
  onChange,
  onSave,
  onClose,
}: Props) {
  const open = !!lift

  useEffect(() => {
    const el = document.documentElement
    const prev = el.style.overflow
    if (open) el.style.overflow = 'hidden'
    return () => { el.style.overflow = prev }
  }, [open])

  if (!lift) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Edit Set">
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <h3 className={styles.title}>Edit Set</h3>

        <div className={styles.body}>
          <div className={styles.field}>
            <label htmlFor="edit-set-date" className={styles.label}>Date</label>
            <input
              id="edit-set-date"
              type="date"
              value={lift.date}
              onChange={(e) => onChange({ ...lift, date: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-set-exercise" className={styles.label}>Exercise</label>
            <select
              id="edit-set-exercise"
              value={lift.exercise}
              onChange={(e) => onChange({ ...lift, exercise: e.target.value })}
              className={styles.select}
            >
              {allExerciseOptions.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-set-equipment" className={styles.label}>Equipment</label>
            <select
              id="edit-set-equipment"
              value={lift.equipment ?? ''}
              onChange={(e) => onChange({ ...lift, equipment: (e.target.value || null) })}
              className={styles.select}
            >
              <option value="">Select equipment</option>
              {EQUIPMENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className={styles.checkboxRow}>
            <input
              id="edit-unilateral"
              type="checkbox"
              checked={!!lift.isUnilateral}
              onChange={(e) => onChange({ ...lift, isUnilateral: e.target.checked })}
              className={styles.checkbox}
            />
            <label htmlFor="edit-unilateral" className={styles.checkboxLabel}>
              Unilateral set
            </label>
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="edit-set-weight" className={styles.label}>Weight (lbs)</label>
              <input
                id="edit-set-weight"
                type="number"
                value={lift.weight}
                onChange={(e) => onChange({ ...lift, weight: parseInt(e.target.value, 10) || 0 })}
                className={styles.input}
                min="0"
                max="1500"
                step="2.5"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="edit-set-reps" className={styles.label}>Reps</label>
              <input
                id="edit-set-reps"
                type="number"
                value={lift.reps}
                onChange={(e) => onChange({ ...lift, reps: parseInt(e.target.value, 10) || 0 })}
                className={styles.input}
                min="1"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-set-set-number" className={styles.label}>Set Number</label>
            <input
              id="edit-set-set-number"
              type="number"
              value={lift.setNumber}
              onChange={(e) => onChange({ ...lift, setNumber: parseInt(e.target.value, 10) || 1 })}
              className={styles.input}
              min="1"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-set-day-tag" className={styles.label}>Day Tag</label>
            <input
              id="edit-set-day-tag"
              type="text"
              value={lift.dayTag ?? ''}
              onChange={(e) => onChange({ ...lift, dayTag: e.target.value })}
              className={styles.input}
              placeholder="e.g., Push Day"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              inputMode="text"
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.save} onClick={onSave}>
            Save Changes
          </button>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
