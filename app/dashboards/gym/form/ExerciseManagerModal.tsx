'use client'

import { useEffect, useState } from 'react'
import {
  listExercises,
  upsertExercise,
  softDeleteExercise,
  type BodyPartKey,
  type Exercise,
} from '@/app/dashboards/gym/catalog'
import { ALL_BODY_PARTS, type BodyPart } from './BodyPartsSheet'
import styles from './ExerciseManagerModal.module.css'

type Props = {
  open: boolean
  onClose: () => void
  filteredRows: Exercise[]
  allRows: Exercise[]
  selectedBodyParts: BodyPart[]
  /** Refresh both catalog lists after a write. Receives the freshly fetched list. */
  onCatalogChange: (all: Exercise[]) => void
  /** Reflect a rename/delete into the currently selected exercise in the form. */
  onRename: (oldName: string, newName: string) => void
  onDeleteName: (name: string) => void
}

export default function ExerciseManagerModal({
  open,
  onClose,
  filteredRows,
  allRows,
  selectedBodyParts,
  onCatalogChange,
  onRename,
  onDeleteName,
}: Props) {
  const [tab, setTab] = useState<'filtered' | 'all'>('filtered')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const el = document.documentElement
    const prev = el.style.overflow
    if (open) el.style.overflow = 'hidden'
    return () => { el.style.overflow = prev }
  }, [open])

  useEffect(() => {
    if (open) setTab('filtered')
  }, [open])

  if (!open) return null

  const refresh = async () => {
    try {
      const all = await listExercises()
      onCatalogChange(all)
    } catch { /* noop */ }
  }

  const rows = tab === 'filtered' ? filteredRows : allRows

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Manage Exercises">
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.frame}>
        <div className={styles.header}>
          <h3 className={styles.title}>Manage Exercises</h3>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <div className={styles.scroll}>
          <div className={styles.inner}>
            <div className={styles.section}>
              <div className={styles.sectionHint}>Add a new exercise to your catalog.</div>
              <AddExerciseInline
                onAdd={async ({ name, bodyPartKey }) => {
                  await upsertExercise({
                    name: name.trim(),
                    bodyPartKey: bodyPartKey as BodyPartKey,
                    isActive: true,
                  })
                  await refresh()
                }}
              />
            </div>

            <div className={styles.divider} />

            <div className={styles.modifyHead}>
              <div>
                <div className={styles.modifyTitle}>Modify Existing Exercises</div>
                <div className={styles.modifySub}>Edit names or body parts.</div>
              </div>
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={[styles.tabBtn, tab === 'filtered' ? styles.tabBtnActive : ''].join(' ')}
                  onClick={() => setTab('filtered')}
                >
                  Filtered ({filteredRows.length})
                </button>
                <button
                  type="button"
                  className={[styles.tabBtn, tab === 'all' ? styles.tabBtnActive : ''].join(' ')}
                  onClick={() => setTab('all')}
                >
                  All ({allRows.length})
                </button>
              </div>
            </div>

            <div className={styles.list}>
              {rows.map((row) => (
                <ManageExerciseRow
                  key={row.id}
                  row={row}
                  busy={busyId === row.id}
                  onSave={async (updated) => {
                    try {
                      setBusyId(row.id)
                      await upsertExercise({
                        id: row.id,
                        name: updated.name.trim(),
                        bodyPartKey: updated.bodyPartKey as BodyPartKey,
                        isActive: true,
                      })
                      await refresh()
                      if (updated.name.trim() !== row.name) {
                        onRename(row.name, updated.name.trim())
                      }
                    } finally {
                      setBusyId(null)
                    }
                  }}
                  onDelete={async () => {
                    if (!confirm(`Delete "${row.name}"? This will hide it from all dropdowns.`)) return
                    try {
                      setBusyId(row.id)
                      await softDeleteExercise(row.id)
                      await refresh()
                      onDeleteName(row.name)
                    } finally {
                      setBusyId(null)
                    }
                  }}
                />
              ))}

              {rows.length === 0 && (
                <div className={styles.empty}>No exercises to show.</div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function AddExerciseInline({
  onAdd,
}: {
  onAdd: (v: { name: string; bodyPartKey: BodyPart }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [bp, setBp] = useState<BodyPart>('chest')
  const [busy, setBusy] = useState(false)

  return (
    <div className={styles.rowCard}>
      <div className={styles.addGrid}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Cable Fly"
          className={styles.input}
        />
        <select
          value={bp}
          onChange={(e) => setBp(e.target.value as BodyPart)}
          className={styles.select}
        >
          {ALL_BODY_PARTS.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={async () => {
            setBusy(true)
            try {
              await onAdd({ name: name.trim(), bodyPartKey: bp })
              setName('')
              setBp('chest')
            } finally {
              setBusy(false)
            }
          }}
          className={styles.addBtn}
        >
          {busy ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  )
}

function ManageExerciseRow({
  row,
  onSave,
  onDelete,
  busy,
}: {
  row: Exercise
  onSave: (updated: { name: string; bodyPartKey: BodyPart }) => Promise<void>
  onDelete: () => Promise<void>
  busy?: boolean
}) {
  const [name, setName] = useState(row.name)
  const [bp, setBp] = useState<BodyPart>((row.bodyPartKey as BodyPart) ?? 'chest')

  useEffect(() => {
    setName(row.name)
    setBp((row.bodyPartKey as BodyPart) ?? 'chest')
  }, [row.id, row.name, row.bodyPartKey])

  return (
    <div className={styles.rowCard}>
      <div className={styles.editGrid}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          placeholder="Exercise name"
        />
        <select
          value={bp}
          onChange={(e) => setBp(e.target.value as BodyPart)}
          className={styles.select}
        >
          {ALL_BODY_PARTS.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className={styles.rowActions}>
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => onSave({ name, bodyPartKey: bp })}
          className={styles.saveBtn}
        >
          {busy ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className={styles.deleteBtn}
        >
          {busy ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
