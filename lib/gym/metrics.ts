import type { GymLift } from '@/app/dashboards/gym/actions'

// Volume = weight x reps per set (unilateral sets record one side; no doubling applied)
export const setVolume = (weight: number, reps: number) => weight * reps

// Epley estimated 1RM. Unrounded; display sites apply Math.round.
export const epley1RM = (weight: number, reps: number) => weight * (1 + reps / 30)

export type OutRow = GymLift & {
  volume: number
  oneRM_est: number
  day_of_week: string
  iso_week: string
  month: string   // YYYY-MM
  year: number
}

// Shared by /api/gym-data and /api/gym-data.csv - field names and order are
// part of the download contract, keep them byte-identical.
export function enrich(lifts: GymLift[]): OutRow[] {
  return lifts.map((l) => {
    const d = new Date(l.date + 'T00:00:00Z')
    // day-of-week in UTC (Mon..Sun)
    const dow = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
    // ISO week (approx)
    const iso = (() => {
      const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
      const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
      return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
    })()
    const month = l.date.slice(0, 7)
    const year = parseInt(l.date.slice(0, 4), 10)
    const volume = setVolume(l.weight, l.reps)
    const oneRM_est = Math.round(epley1RM(l.weight, l.reps))
    return { ...l, volume, oneRM_est, day_of_week: dow, iso_week: iso, month, year }
  })
}
