'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import type { GymLift } from '../../actions'
import type { BodyPart } from '../BodyDiagram'
import ChartWrapper from '@/components/dashboard/ChartWrapper'

const BP_COLORS: Record<BodyPart | 'other', string> = {
  chest:      '#7A2E2E',
  back:       '#4A4239',
  shoulders:  '#B8893B',
  biceps:     '#4A6B3A',
  triceps:    '#8A7F71',
  quads:      '#5C3A1A',
  hamstrings: '#1A4A3A',
  core:       '#3A1A4A',
  glutes:     '#9A5A3A',
  calves:     '#3A6B5A',
  forearms:   '#6B6B3A',
  hips:       '#5A3A6B',
  other:      '#D8CFC2',
}

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim().replace(/s\b/, '')

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

const EX_TO_BP = (() => {
  const m = new Map<string, BodyPart>()
  for (const [bp, exes] of Object.entries(EXERCISES_BY_BODY_PART)) {
    for (const ex of exes) m.set(normalize(ex), bp as BodyPart)
  }
  m.set(normalize('RDL'), 'hamstrings')
  return m
})()

function bodyPartForExercise(ex: string): BodyPart | 'other' {
  return EX_TO_BP.get(normalize(ex)) ?? 'other'
}

type Props = { dayLifts: GymLift[] }

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const v = Number(p.value || 0)
  const datum = p?.payload || {}
  const total = datum.total || 1
  const pct = Math.round((v / total) * 100)
  return (
    <div style={{
      background: 'var(--color-paper)',
      border: '1px solid var(--color-rule)',
      padding: '4px 8px',
      fontFamily: 'var(--font-sans)',
      fontSize: '11px',
      color: 'var(--color-ink)',
    }}>
      <div style={{ textTransform: 'capitalize' }}>{p.name}: {v.toLocaleString()} lbs ({pct}%)</div>
      <div style={{ color: 'var(--color-ink-3)' }}>{datum.sets ?? 0} sets</div>
    </div>
  )
}

export default function MuscleVolumeDonut({ dayLifts }: Props) {
  const { data, isEmpty } = useMemo(() => {
    const vols = new Map<BodyPart, number>()
    const sets = new Map<BodyPart, number>()
    for (const l of dayLifts) {
      const bp = bodyPartForExercise(l.exercise)
      if (bp === 'other') continue
      vols.set(bp, (vols.get(bp) || 0) + l.weight * l.reps)
      sets.set(bp, (sets.get(bp) || 0) + 1)
    }
    const total = Array.from(vols.values()).reduce((s, v) => s + v, 0)
    const arr = Array.from(vols.entries())
      .map(([bp, volume]) => ({ bp, name: bp, volume, sets: sets.get(bp) || 0, color: BP_COLORS[bp], total }))
      .sort((a, b) => b.volume - a.volume)
    return { data: arr, isEmpty: arr.length === 0 }
  }, [dayLifts])

  return (
    <ChartWrapper height={220} isEmpty={isEmpty} emptyMessage="No mapped exercises">
      <PieChart>
        <Pie
          data={data}
          dataKey="volume"
          nameKey="name"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ChartWrapper>
  )
}
