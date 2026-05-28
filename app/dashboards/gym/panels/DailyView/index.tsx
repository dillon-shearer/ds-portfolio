'use client'

import { useMemo } from 'react'
import type { GymLift } from '../../actions'
import type { BodyPart } from '../BodyDiagram'
import DashboardPanel from '@/components/dashboard/DashboardPanel'
import StatWidget from '@/components/dashboard/StatWidget'
import SevenDayStrip from './SevenDayStrip'
import CumulativeVolumeChart from './CumulativeVolumeChart'
import MuscleVolumeDonut from './MuscleVolumeDonut'
import ExerciseTable from './ExerciseTable'
import styles from './index.module.css'

const EXERCISES_BY_BODY_PART: Record<BodyPart, string[]> = {
  biceps:     ['Preacher Curl', 'Hammer Curl', 'Bayesian Curl', 'Incline Curl'],
  chest:      ['Incline Press', 'Flat Press', 'Decline Press', 'Chest Fly', 'Bench Press'],
  shoulders:  ['Lateral Raise', 'Overhead Press', 'Rear Delt Fly', 'Rear Delt Xs'],
  back:       ['Lat Pulldown', 'High Row', 'Low Row', 'Pull Ups', 'Pull Overs'],
  triceps:    ['Tricep Pushdowns', 'Tricep Extensions', 'Skull Crushers', 'Tricep Kickbacks', 'Dips'],
  quads:      ['Leg Press', 'Hack Squat', 'Pendelum Squat', 'Squat', 'Leg Extensions', 'Split Squat'],
  hamstrings: ['RDLs', 'Seated Leg Curl', 'Lying Leg Curl', 'Hamstrick Kickback'],
  forearms:   ['Wrist Curl', 'Reverse Curl', 'Reverse Wrist Curl'],
  core:       ['Hanging Leg Raise', 'Decline Crunch', 'Flat Crunch', 'Incline Crunch', 'Oblique Twist'],
  glutes:     ['Hip Thrust', 'Glute Kickback'],
  calves:     ['Standing Calf Raise', 'Seated Calf Raise'],
  hips:       ['Abduction Machine', 'Adduction Machine'],
}

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim().replace(/s\b/, '')

const EX_TO_BP = (() => {
  const m = new Map<string, BodyPart>()
  for (const [bp, exes] of Object.entries(EXERCISES_BY_BODY_PART)) {
    for (const ex of exes) m.set(normalize(ex), bp as BodyPart)
  }
  m.set(normalize('RDL'), 'hamstrings')
  m.set(normalize('Hip Thrusts'), 'glutes')
  m.set(normalize('Pull Up'), 'back')
  m.set(normalize('Pull Over'), 'back')
  return m
})()

function bodyPartForExercise(ex: string): BodyPart | 'other' {
  return EX_TO_BP.get(normalize(ex)) ?? 'other'
}

type Props = {
  lifts: GymLift[]
  date: string
  onChangeDate: (date: string) => void
}

export default function DailyView({ lifts, date, onChangeDate }: Props) {
  const dayLifts = useMemo(() => lifts.filter(l => l.date === date), [lifts, date])

  const totalVolume = useMemo(() => dayLifts.reduce((s, l) => s + l.weight * l.reps, 0), [dayLifts])
  const totalSets = dayLifts.length
  const totalReps = useMemo(() => dayLifts.reduce((s, l) => s + l.reps, 0), [dayLifts])
  const exerciseCount = useMemo(() => new Set(dayLifts.map(l => l.exercise)).size, [dayLifts])

  const nearMaxSets = useMemo(() => {
    const prMap: Record<string, number> = {}
    for (const l of lifts) {
      const est = Math.round(l.weight * (1 + l.reps / 30))
      if (!prMap[l.exercise] || est > prMap[l.exercise]) prMap[l.exercise] = est
    }
    return dayLifts.filter(l => {
      const best = prMap[l.exercise] || 0
      const cur = Math.round(l.weight * (1 + l.reps / 30))
      return best > 0 && cur / best >= 0.9
    }).length
  }, [dayLifts, lifts])

  const topBodyPart = useMemo(() => {
    const vols = new Map<BodyPart, number>()
    for (const l of dayLifts) {
      const bp = bodyPartForExercise(l.exercise)
      if (bp === 'other') continue
      vols.set(bp, (vols.get(bp) || 0) + l.weight * l.reps)
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
        <StatWidget label="Total Volume" value={totalVolume} sub="lbs" />
        <StatWidget label="Exercises / Sets / Reps" value={`${exerciseCount} / ${totalSets} / ${totalReps}`} />
        <StatWidget label="Top Body Part" value={topBodyPart} />
        <StatWidget label="Near-Max Sets" value={nearMaxSets} sub=">= 90% lifetime 1RM" />
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
