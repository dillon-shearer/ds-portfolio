import type { GymLift } from './actions'

export type GymUiState = 'loaded' | 'empty' | 'loading' | 'error'

const UI_STATE_PARAM = '__uiState'

function isoDay(offset: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

function timestamp(day: string, hour: number) {
  return `${day}T${String(hour).padStart(2, '0')}:00:00.000Z`
}

/**
 * UI evidence only: this query seam is deliberately unavailable in production.
 * It lets browser scenarios render the gym dashboard without a database.
 */
export function gymUiState(searchParams: {
  [UI_STATE_PARAM]?: string | string[]
}): GymUiState | null {
  if (process.env.NODE_ENV === 'production') return null

  const candidate = searchParams[UI_STATE_PARAM]
  const value = Array.isArray(candidate) ? candidate[0] : candidate
  return value === 'loaded' || value === 'empty' || value === 'loading' || value === 'error'
    ? value
    : null
}

export function gymFixtureLifts(): GymLift[] {
  const today = isoDay(0)
  const yesterday = isoDay(-1)
  const twoDaysAgo = isoDay(-2)

  return [
    {
      id: 'ui-fixture-bench-1',
      date: today,
      exercise: 'Bench Press',
      weight: 185,
      reps: 8,
      setNumber: 1,
      timestamp: timestamp(today, 9),
      dayTag: 'Push Day',
      isUnilateral: false,
      equipment: 'Barbell',
    },
    {
      id: 'ui-fixture-bench-2',
      date: today,
      exercise: 'Bench Press',
      weight: 185,
      reps: 7,
      setNumber: 2,
      timestamp: timestamp(today, 10),
      dayTag: 'Push Day',
      isUnilateral: false,
      equipment: 'Barbell',
    },
    {
      id: 'ui-fixture-row-1',
      date: yesterday,
      exercise: 'Cable Row',
      weight: 140,
      reps: 10,
      setNumber: 1,
      timestamp: timestamp(yesterday, 10),
      dayTag: 'Pull Day',
      isUnilateral: false,
      equipment: 'Cable',
    },
    {
      id: 'ui-fixture-squat-1',
      date: twoDaysAgo,
      exercise: 'Back Squat',
      weight: 225,
      reps: 5,
      setNumber: 1,
      timestamp: timestamp(twoDaysAgo, 9),
      dayTag: 'Leg Day',
      isUnilateral: false,
      equipment: 'Barbell',
    },
  ]
}
