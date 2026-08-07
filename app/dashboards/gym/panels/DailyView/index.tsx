'use client'

import { useMemo } from 'react'
import type { GymLift } from '../../actions'
import { bodyPartForExercise, type BodyPart } from '@/lib/gym/body-parts'
import { estimated1RM, setVolume } from '@/lib/gym/metrics'
import DashboardPanel from '@/components/dashboard/DashboardPanel'
import StatWidget from '@/components/dashboard/StatWidget'
import SevenDayStrip from './SevenDayStrip'
import CumulativeVolumeChart from './CumulativeVolumeChart'
import MuscleVolumeDonut from './MuscleVolumeDonut'
import ExerciseTable from './ExerciseTable'
import styles from './index.module.css'

type Props = {
  lifts: GymLift[]
  date: string
  onChangeDate: (date: string) => void
}

export default function DailyView({ lifts, date, onChangeDate }: Props) {
  const dayLifts = useMemo(() => lifts.filter((l) => l.date === date), [lifts, date])

  const totalVolume = useMemo(
    () => dayLifts.reduce((s, l) => s + setVolume(l.weight, l.reps), 0),
    [dayLifts],
  )
  const totalSets = dayLifts.length
  const totalReps = useMemo(() => dayLifts.reduce((s, l) => s + l.reps, 0), [dayLifts])
  const exerciseCount = useMemo(() => new Set(dayLifts.map((l) => l.exercise)).size, [dayLifts])

  const nearMaxSets = useMemo(() => {
    const prMap: Record<string, number> = {}
    for (const l of lifts) {
      const est = estimated1RM(l.weight, l.reps)
      if (!prMap[l.exercise] || est > prMap[l.exercise]) prMap[l.exercise] = est
    }
    return dayLifts.filter((l) => {
      const best = prMap[l.exercise] || 0
      const cur = estimated1RM(l.weight, l.reps)
      return best > 0 && cur / best >= 0.9
    }).length
  }, [dayLifts, lifts])

  const topBodyPart = useMemo(() => {
    const vols = new Map<BodyPart, number>()
    for (const l of dayLifts) {
      const bp = bodyPartForExercise(l.exercise)
      if (bp === 'other') continue
      vols.set(bp, (vols.get(bp) || 0) + setVolume(l.weight, l.reps))
    }
    if (vols.size === 0) return 'None'
    return Array.from(vols.entries()).sort((a, b) => b[1] - a[1])[0][0]
  }, [dayLifts])

  return (
    <div className={styles.root}>
      <DashboardPanel eyebrow="Last 7 Days">
        <SevenDayStrip lifts={lifts} date={date} onChangeDate={onChangeDate} />
      </DashboardPanel>
      <div className={styles.kpiRow}>
        <StatWidget label="Total Volume" value={totalVolume} sub="lbs" className={styles.kpiItem} />
        <StatWidget
          label="Exercises / Sets / Reps"
          value={`${exerciseCount} / ${totalSets} / ${totalReps}`}
          className={styles.kpiItem}
        />
        <StatWidget label="Top Body Part" value={topBodyPart} className={styles.kpiItem} />
        <StatWidget
          label="Near-Max Sets"
          value={nearMaxSets}
          sub=">= 90% lifetime 1RM"
          className={styles.kpiItem}
        />
      </div>
      <div className={styles.chartRow}>
        <DashboardPanel eyebrow="Cumulative Volume by Body Part" className={styles.chartLarge}>
          <CumulativeVolumeChart dayLifts={dayLifts} />
        </DashboardPanel>
        <DashboardPanel eyebrow="Muscle Volume" className={styles.chartSmall}>
          <MuscleVolumeDonut dayLifts={dayLifts} />
        </DashboardPanel>
      </div>
      <DashboardPanel eyebrow="Sets">
        <ExerciseTable dayLifts={dayLifts} allLifts={lifts} />
      </DashboardPanel>
    </div>
  )
}
