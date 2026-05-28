'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  addGymLift,
  getGymLifts,
  deleteGymLift,
  updateGymLift,
  getDayTags,
  getDayTagForDate,
  setDayTagForDate,
  getBodyPartsForDate,
  setBodyPartsForDate,
  getBootstrapData,
  type GymLift,
} from '@/app/dashboards/gym/actions'
import {
  type Exercise,
} from '@/app/dashboards/gym/catalog'
import DayInfoSheet from './DayInfoSheet'
import BodyPartsSheet, { ALL_BODY_PARTS, type BodyPart } from './BodyPartsSheet'
import ExerciseManagerModal from './ExerciseManagerModal'
import EditSetModal, { EQUIPMENT_OPTIONS, type Equipment } from './EditSetModal'
import styles from './WorkoutForm.module.css'

// DayTag -> default body parts
const DAYTAG_DEFAULTS: Record<string, BodyPart[]> = {
  'push day': ['chest', 'biceps', 'shoulders'],
  'pull day': ['back', 'triceps', 'core'],
  'leg day': ['quads', 'hamstrings', 'hips', 'glutes', 'calves'],
}

export default function WorkoutForm() {
  const todayISO = new Date().toISOString().split('T')[0]
  const [formData, setFormData] = useState({
    date: todayISO,
    exercise: '',
    weight: '',
    reps: '',
    dayTag: '',
    isUnilateral: false,
    equipment: '' as '' | Equipment,
  })

  // DB-backed exercise rows
  const [exerciseRows, setExerciseRows] = useState<Exercise[]>([])
  const [allExRows, setAllExRows] = useState<Exercise[]>([])

  // Derived option names
  const [exerciseOptions, setExerciseOptions] = useState<string[]>([])
  const [allExOptions, setAllExOptions] = useState<string[]>([])

  // Manage modal
  const [showManageEx, setShowManageEx] = useState(false)

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [allLifts, setAllLifts] = useState<GymLift[]>([])
  const [editingLift, setEditingLift] = useState<GymLift | null>(null)

  // Sheets
  const [showDayInfo, setShowDayInfo] = useState(false)
  const [showBodyParts, setShowBodyParts] = useState(false)

  // First-run flow controller (Day Info -> Body Parts)
  const [flowPending, setFlowPending] = useState(false)

  // Body part selection
  const [selectedBodyParts, setSelectedBodyParts] = useState<BodyPart[]>([])

  const [existingDayTags, setExistingDayTags] = useState<string[]>([])
  const defaultDayTags = useMemo(() => ['Push Day', 'Pull Day', 'Leg Day'], [])

  // Avoid reapplying defaults repeatedly
  const lastAppliedDayTagRef = useRef<string>('')
  // Avoid re-fetching DayInfo immediately after bootstrap
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function bootstrap() {
    try {
      const { lifts, tags, dayTag, bodyParts, allExercises } = await getBootstrapData(formData.date)

      setAllLifts(lifts)
      setExistingDayTags(tags)
      setFormData(fd => ({ ...fd, dayTag: dayTag ?? '' }))

      let activeParts: BodyPart[] = []
      if (bodyParts && bodyParts.length) {
        activeParts = bodyParts as BodyPart[]
        lastAppliedDayTagRef.current = (dayTag || '').trim().toLowerCase()
      } else {
        const normalized = (dayTag || '').trim().toLowerCase()
        if (normalized && DAYTAG_DEFAULTS[normalized]) {
          activeParts = DAYTAG_DEFAULTS[normalized]
          lastAppliedDayTagRef.current = normalized
        }
      }
      setSelectedBodyParts(activeParts)

      setAllExRows(allExercises)
      setAllExOptions(allExercises.map(e => e.name))

      const initialRows = allExercises.filter(r =>
        activeParts.length ? activeParts.includes(r.bodyPartKey as BodyPart) : true
      )
      setExerciseRows(initialRows)
      setExerciseOptions(initialRows.map(r => r.name))

      bootstrappedRef.current = true

      if (typeof window !== 'undefined') {
        const key = `gymFlowSeenForDate:${formData.date}`
        const seen = localStorage.getItem(key)
        if (!seen) {
          setFlowPending(true)
          setShowDayInfo(true)
        }
      }
    } catch (e) {
      console.warn('bootstrap failed:', e)
    }
  }

  // If date changes (via Day Info), refresh its metadata
  useEffect(() => {
    if (!bootstrappedRef.current) return
    fetchDayInfoFor(formData.date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date])

  const fetchAllLifts = async () => {
    try {
      const lifts = await getGymLifts()
      setAllLifts(lifts)
    } catch (error) {
      console.error('Error fetching lifts:', error)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const fetchDayTags = async () => {
    try {
      const tags = await getDayTags()
      setExistingDayTags(tags)
    } catch (e) {
      console.warn('Could not fetch day tags (optional):', e)
    }
  }

  const fetchDayInfoFor = async (date: string) => {
    try {
      const [tag, parts] = await Promise.all([
        getDayTagForDate(date),
        getBodyPartsForDate(date),
      ])
      setFormData(fd => ({ ...fd, dayTag: tag ?? '' }))

      if (parts && parts.length) {
        setSelectedBodyParts(parts as BodyPart[])
        lastAppliedDayTagRef.current = (tag || '').trim().toLowerCase()
      } else {
        const normalized = (tag || '').trim().toLowerCase()
        if (normalized && DAYTAG_DEFAULTS[normalized]) {
          setSelectedBodyParts(DAYTAG_DEFAULTS[normalized])
          lastAppliedDayTagRef.current = normalized
        } else {
          setSelectedBodyParts([])
        }
      }
    } catch { /* noop */ }
  }

  useEffect(() => {
    const normalized = (formData.dayTag || '').trim().toLowerCase()
    const recognized = DAYTAG_DEFAULTS[normalized]
    if (recognized && lastAppliedDayTagRef.current !== normalized) {
      setSelectedBodyParts(recognized)
      lastAppliedDayTagRef.current = normalized
    }
  }, [formData.dayTag])

  // Refresh exercise options whenever selected body parts change
  useEffect(() => {
    const rows = allExRows.filter(r =>
      selectedBodyParts.includes((r.bodyPartKey as BodyPart))
    )
    setExerciseRows(rows)
    setExerciseOptions(rows.map(r => r.name))
  }, [selectedBodyParts, allExRows])

  // If current exercise is no longer available, clear it
  useEffect(() => {
    setFormData(fd => {
      if (!fd.exercise) return fd
      return exerciseOptions.includes(fd.exercise) ? fd : { ...fd, exercise: '', weight: '' }
    })
  }, [exerciseOptions])

  const toggleBodyPart = (bp: BodyPart) => {
    setSelectedBodyParts(curr =>
      curr.includes(bp) ? curr.filter(x => x !== bp) : [...curr, bp]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    try {
      if (!formData.date || !formData.exercise || !formData.weight || !formData.reps || !formData.equipment) {
        throw new Error('Please fill in all required fields')
      }

      const existingSets = allLifts.filter(
        lift => lift.date === formData.date && lift.exercise === formData.exercise
      )
      const nextSetNumber = existingSets.length > 0
        ? Math.max(...existingSets.map(s => s.setNumber)) + 1
        : 1

      await addGymLift({
        date: formData.date,
        exercise: formData.exercise,
        weight: parseFloat(formData.weight),
        reps: parseInt(formData.reps, 10),
        setNumber: nextSetNumber,
        dayTag: (formData.dayTag || '').trim() || null,
        isUnilateral: formData.isUnilateral,
        equipment: formData.equipment,
      })

      setStatus('success')
      setFormData({
        ...formData,
        reps: '', // fast add flow
      })

      await fetchAllLifts()
      await fetchDayTags()
      setTimeout(() => setStatus('idle'), 2000)
    } catch (error) {
      console.error('Error saving data:', error)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this set?')) return
    try {
      await deleteGymLift(id)
      await fetchAllLifts()
    } catch (error) {
      console.error('Error deleting lift:', error)
      alert('Failed to delete lift. Please try again.')
    }
  }

  const handleUpdate = async () => {
    if (!editingLift) return
    try {
      await updateGymLift(editingLift.id, {
        date: editingLift.date,
        exercise: editingLift.exercise,
        weight: editingLift.weight,
        reps: editingLift.reps,
        setNumber: editingLift.setNumber,
        dayTag: editingLift.dayTag ?? null,
        isUnilateral: editingLift.isUnilateral ?? null,
        equipment: editingLift.equipment ?? null,
      })
      setEditingLift(null)
      await fetchAllLifts()
      await fetchDayTags()
    } catch (error) {
      console.error('Error updating lift:', error)
      alert('Failed to update lift. Please try again.')
    }
  }

  // ---- Derivations for selected date ----
  const liftsForSelectedDate = useMemo(
    () => allLifts
      .filter(l => l.date === formData.date)
      .sort((a, b) => {
        const ta = Date.parse(a.timestamp)
        const tb = Date.parse(b.timestamp)
        if (ta === tb) return a.id.localeCompare(b.id)
        return ta - tb
      }),
    [allLifts, formData.date]
  )

  const liftsByExerciseForSelectedDate = useMemo(() => {
    const acc: Record<string, GymLift[]> = {}
    for (const lift of liftsForSelectedDate) {
      (acc[lift.exercise] ||= []).push(lift)
    }
    return acc
  }, [liftsForSelectedDate])

  const exerciseGroupsChrono = useMemo(() => {
    return Object.entries(liftsByExerciseForSelectedDate)
      .map(([exercise, sets]) => {
        const setsChrono = [...sets].sort((a, b) => {
          const ta = Date.parse(a.timestamp)
          const tb = Date.parse(b.timestamp)
          if (ta === tb) return a.id.localeCompare(b.id)
          return ta - tb
        })
        const latestTs = Date.parse(setsChrono[setsChrono.length - 1]?.timestamp ?? '')
        const exerciseVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
        return { exercise, sets: setsChrono, latestTs, exerciseVolume }
      })
      .sort((a, b) => b.latestTs - a.latestTs)
  }, [liftsByExerciseForSelectedDate])

  const totalVolumeForSelectedDate = liftsForSelectedDate.reduce((sum, lift) => sum + (lift.weight * lift.reps), 0)
  const dayTagForSelectedDate = (formData.dayTag || '').trim()
  const exerciseCount = Object.keys(liftsByExerciseForSelectedDate).length

  // --------- Day Info -> Body Parts flow handlers ----------
  const handleCloseDayInfo = () => {
    setShowDayInfo(false)
    if (flowPending) {
      setTimeout(() => setShowBodyParts(true), 60)
    }
  }
  const handleCloseBodyParts = () => {
    setShowBodyParts(false)
    if (flowPending && typeof window !== 'undefined') {
      const key = `gymFlowSeenForDate:${formData.date}`
      localStorage.setItem(key, '1')
      setFlowPending(false)
    }
  }

  const handleSaveDayInfo = async () => {
    const raw = (formData.dayTag || '').trim()
    const tag = raw.length ? raw : null
    try {
      await setDayTagForDate(formData.date, tag)
      try { await fetchAllLifts() } catch {}
      try { await fetchDayTags() } catch {}
      const normalized = (tag || '').toLowerCase()
      if (normalized && DAYTAG_DEFAULTS[normalized]) {
        setSelectedBodyParts(DAYTAG_DEFAULTS[normalized])
        lastAppliedDayTagRef.current = normalized
      }
      handleCloseDayInfo()
    } catch (err) {
      console.error('Failed to save day info:', err)
      handleCloseDayInfo()
    }
  }

  const handleSaveBodyParts = async () => {
    try {
      await setBodyPartsForDate(formData.date, selectedBodyParts)
      handleCloseBodyParts()
    } catch (e) {
      console.error('Failed to save body parts:', e)
      alert('Failed to save body parts. Try again.')
    }
  }

  return (
    <div className={styles.root}>
      {/* Top controls */}
      <div className={styles.toolbar}>
        <button type="button" className={styles.toolBtn} onClick={() => setShowDayInfo(true)}>
          Day Info
        </button>
        <button type="button" className={styles.toolBtn} onClick={() => setShowBodyParts(true)}>
          Body Parts
        </button>
      </div>

      {status === 'success' && (
        <div className={[styles.banner, styles.bannerSuccess].join(' ')}>
          Set saved. Add another or change exercise.
        </div>
      )}
      {status === 'error' && (
        <div className={[styles.banner, styles.bannerError].join(' ')}>
          Error saving data. Check your setup and console logs.
        </div>
      )}

      {/* ===================== Add New Set ===================== */}
      <form onSubmit={handleSubmit} className={styles.card}>
        <h2 className={styles.cardTitle}>Add New Set</h2>

        <div className={styles.dateLine}>
          <span className={styles.dateLineLabel}>Date:</span>
          <span className={styles.dateLineValue}>{formData.date}</span>
          {dayTagForSelectedDate && (
            <>
              <span className={styles.dateLineSep}>·</span>
              <span className={styles.chip}>{dayTagForSelectedDate}</span>
            </>
          )}
        </div>

        <div className={styles.fields}>
          {/* Exercise */}
          <div className={styles.field}>
            <label className={styles.label}>Exercise *</label>
            <div className={styles.manageRow}>
              <button
                type="button"
                className={styles.manageBtn}
                onClick={() => setShowManageEx(true)}
                title="Manage your exercise catalog"
              >
                Manage Exercises
              </button>
            </div>
            <select
              value={formData.exercise}
              onChange={(e) => setFormData({ ...formData, exercise: e.target.value, weight: '' })}
              className={styles.select}
              required
            >
              <option value="">
                {exerciseOptions.length === 0 ? 'No exercises for current selection' : 'Select exercise'}
              </option>
              {exerciseOptions.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
            <div className={styles.count}>{exerciseOptions.length} available</div>
          </div>

          {/* Equipment */}
          <div className={styles.field}>
            <label className={styles.label}>Equipment *</label>
            <select
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value as Equipment })}
              required
              className={styles.select}
            >
              <option value="">Select equipment</option>
              {EQUIPMENT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Unilateral */}
          <div className={styles.checkboxRow}>
            <input
              id="unilateral"
              type="checkbox"
              checked={formData.isUnilateral}
              onChange={(e) => setFormData({ ...formData, isUnilateral: e.target.checked })}
              className={styles.checkbox}
            />
            <label htmlFor="unilateral" className={styles.checkboxLabel}>Unilateral set</label>
            <span className={styles.checkboxHint}>(Flag only)</span>
          </div>

          {/* Weight */}
          <div className={styles.field}>
            <label className={styles.label}>Weight (lbs) *</label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className={styles.inputMono}
              min="0"
              max="1500"
              step="2.5"
              required
            />
          </div>

          {/* Reps */}
          <div className={styles.field}>
            <label className={styles.label}>Reps *</label>
            <input
              type="number"
              value={formData.reps}
              onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
              className={styles.inputMono}
              min="1"
              required
            />
          </div>

          <button type="submit" disabled={status === 'submitting'} className={styles.submit}>
            {status === 'submitting' ? 'Saving...' : 'Add Set'}
          </button>
        </div>
      </form>

      {/* ===================== Workout History ===================== */}
      <div className={styles.history}>
        <h3 className={styles.historyTitle}>
          Workout History for <span className={styles.historyDate}>{formData.date}</span>
        </h3>
        <div className={styles.historyMeta}>
          {dayTagForSelectedDate && <span className={styles.chip}>{dayTagForSelectedDate}</span>}
          <span className={styles.historyMetaText}>
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} ·{' '}
            <span className={styles.historyMetaNum}>{totalVolumeForSelectedDate.toLocaleString()}</span> lbs total
          </span>
        </div>

        {liftsForSelectedDate.length === 0 ? (
          <p className={styles.emptyState}>No sets yet for this date.</p>
        ) : (
          <div className={styles.groups}>
            {exerciseGroupsChrono.map(({ exercise, sets, exerciseVolume }) => (
              <div key={exercise} className={styles.group}>
                <div className={styles.groupHead}>
                  <span className={styles.groupName}>{exercise}</span>
                  <span className={styles.groupVolume}>{exerciseVolume.toLocaleString()} lbs</span>
                </div>
                <div className={styles.sets}>
                  {sets.map((set) => (
                    <div key={set.id} className={styles.setRow}>
                      <div className={styles.setInfo}>
                        <span className={styles.setLabel}>
                          Set {set.setNumber}: <span className={styles.setStat}>{set.weight} lbs x {set.reps} reps</span>
                        </span>
                        {set.equipment ? (
                          <span className={styles.setBadge}>{set.equipment}</span>
                        ) : null}
                        {set.isUnilateral ? (
                          <span className={styles.setBadgeUni}>UNI</span>
                        ) : null}
                      </div>
                      <div className={styles.setActions}>
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={() => setEditingLift(set)}
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(set.id)}
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sheets and modals */}
      <DayInfoSheet
        open={showDayInfo}
        onClose={handleCloseDayInfo}
        date={formData.date}
        onDateChange={(date) => setFormData(fd => ({ ...fd, date }))}
        dayTag={formData.dayTag}
        onDayTagChange={(tag) => setFormData(fd => ({ ...fd, dayTag: tag }))}
        defaultDayTags={defaultDayTags}
        onSave={handleSaveDayInfo}
      />

      <BodyPartsSheet
        open={showBodyParts}
        onClose={handleCloseBodyParts}
        selected={selectedBodyParts}
        onToggle={toggleBodyPart}
        onSelectAll={() => setSelectedBodyParts(ALL_BODY_PARTS)}
        onClear={() => setSelectedBodyParts([])}
        onSave={handleSaveBodyParts}
      />

      <ExerciseManagerModal
        open={showManageEx}
        onClose={() => setShowManageEx(false)}
        filteredRows={exerciseRows}
        allRows={allExRows}
        selectedBodyParts={selectedBodyParts}
        onCatalogChange={(all) => {
          setAllExRows(all)
          setAllExOptions(all.map(e => e.name))
        }}
        onRename={(oldName, newName) => {
          setFormData(fd => (fd.exercise === oldName ? { ...fd, exercise: newName, weight: '' } : fd))
        }}
        onDeleteName={(name) => {
          setFormData(fd => (fd.exercise === name ? { ...fd, exercise: '', weight: '' } : fd))
        }}
      />

      <EditSetModal
        lift={editingLift}
        allExerciseOptions={allExOptions}
        onChange={setEditingLift}
        onSave={handleUpdate}
        onClose={() => setEditingLift(null)}
      />
    </div>
  )
}
