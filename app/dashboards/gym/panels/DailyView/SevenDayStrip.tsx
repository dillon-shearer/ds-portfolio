'use client'

import { useMemo } from 'react'
import type { GymLift } from '../../actions'
import styles from './SevenDayStrip.module.css'

type Props = {
  lifts: GymLift[]
  date: string
  onChangeDate: (d: string) => void
}

function ymd(d: Date) { return d.toISOString().slice(0, 10) }

function fmtWeekdayShort(d: Date) {
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' })
}

function fmtShortMD(d: Date) {
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'numeric', day: 'numeric' })
}

export default function SevenDayStrip({ lifts, date, onChangeDate }: Props) {
  const last7 = useMemo(() => {
    const now = new Date()
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const volMap = new Map<string, number>()
    for (const l of lifts) volMap.set(l.date, (volMap.get(l.date) || 0) + l.weight * l.reps)

    return Array.from({ length: 7 }, (_, offset) => {
      const d = new Date(todayUTC)
      d.setUTCDate(todayUTC.getUTCDate() - (6 - offset))
      const k = ymd(d)
      return {
        ymd: k,
        weekday: fmtWeekdayShort(d),
        md: fmtShortMD(d),
        hasData: (volMap.get(k) ?? 0) > 0,
        isToday: offset === 6,
      }
    })
  }, [lifts])

  return (
    <div className={styles.strip}>
      {last7.map((d) => {
        const isSelected = d.ymd === date
        return (
          <button
            key={d.ymd}
            type="button"
            onClick={() => onChangeDate(d.ymd)}
            className={[
              styles.day,
              isSelected ? styles.dayActive : d.hasData ? styles.dayHasData : styles.dayEmpty,
            ].join(' ')}
            aria-pressed={isSelected}
            aria-label={`${d.weekday} ${d.md}${d.isToday ? ' (Today)' : ''}`}
          >
            <span className={styles.weekday}>{d.isToday ? 'Today' : d.weekday}</span>
            <span className={styles.md}>{d.md}</span>
          </button>
        )
      })}
    </div>
  )
}
