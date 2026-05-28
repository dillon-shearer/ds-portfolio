'use client'

import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { GymLift } from '../../actions'
import type { BodyPart } from '../BodyDiagram'
import ChartWrapper from '@/components/dashboard/ChartWrapper'

// Portfolio chart bp colors (hardcoded hex matching tokens.css for SVG gradients)
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
  m.set(normalize('Hip Thrusts'), 'glutes')
  m.set(normalize('Pull Up'), 'back')
  m.set(normalize('Pull Over'), 'back')
  return m
})()

function bodyPartForExercise(ex: string): BodyPart | 'other' {
  return EX_TO_BP.get(normalize(ex)) ?? 'other'
}

type Props = { dayLifts: GymLift[] }

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  return (
    <div style={{
      background: 'var(--color-paper)',
      border: '1px solid var(--color-rule)',
      padding: '4px 8px',
      fontFamily: 'var(--font-sans)',
      fontSize: '11px',
    }}>
      <div style={{ color: 'var(--color-ink)' }}>{p.ex}</div>
      <div style={{ color: 'var(--color-ink-3)' }}>{p.bp !== 'other' ? p.bp : ''}</div>
      <div style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
        {Number(p.cumVol).toLocaleString()} lbs cumulative
      </div>
    </div>
  )
}

export default function CumulativeVolumeChart({ dayLifts }: Props) {
  const { cumSeries, bpStops, legendBPs } = useMemo(() => {
    const seq = [...dayLifts].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime() || 0
      const tb = new Date(b.timestamp).getTime() || 0
      if (ta !== tb) return ta - tb
      if (a.exercise !== b.exercise) return a.exercise.localeCompare(b.exercise)
      return a.setNumber - b.setNumber
    })

    let cum = 0
    const series = seq.map((l, i) => {
      cum += l.weight * l.reps
      const bp = bodyPartForExercise(l.exercise)
      return { idx: i + 1, cumVol: cum, bp, ex: l.exercise }
    })

    const stops: { key: string; offset: number; color: string }[] = []
    const n = series.length
    if (n > 0) {
      let prevBP = series[0].bp
      stops.push({ key: 'start', offset: 0, color: BP_COLORS[prevBP] })
      for (let i = 1; i < n; i++) {
        const cur = series[i].bp
        if (cur !== prevBP) {
          const off = n > 1 ? (i / (n - 1)) * 100 : 100
          stops.push({ key: `a-${i}`, offset: off, color: BP_COLORS[prevBP] })
          stops.push({ key: `b-${i}`, offset: off, color: BP_COLORS[cur] })
          prevBP = cur
        }
      }
      stops.push({ key: 'end', offset: 100, color: BP_COLORS[prevBP] })
    }

    const bpSet = new Set<BodyPart>()
    for (const p of series) { if (p.bp !== 'other') bpSet.add(p.bp) }

    return { cumSeries: series, bpStops: stops, legendBPs: Array.from(bpSet) }
  }, [dayLifts])

  return (
    <div>
      <ChartWrapper height={240} isEmpty={cumSeries.length === 0} emptyMessage="No sets logged">
        <AreaChart data={cumSeries} margin={{ top: 10, right: 8, bottom: 24, left: 40 }}>
          <defs>
            <linearGradient id="bpStroke" x1="0" y1="0" x2="1" y2="0">
              {bpStops.map(s => <stop key={s.key} offset={`${s.offset}%`} stopColor={s.color} />)}
            </linearGradient>
            <linearGradient id="bpFill" x1="0" y1="0" x2="1" y2="0">
              {bpStops.map(s => (
                <stop key={`${s.key}-f`} offset={`${s.offset}%`} stopColor={s.color} stopOpacity={0.15} />
              ))}
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-rule-soft)" strokeOpacity={0.5} />
          <XAxis
            dataKey="idx"
            tick={{ fontSize: 12, fill: 'var(--color-ink-3)', fontFamily: 'var(--font-mono)' }}
            stroke="var(--color-rule)"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-ink-3)', fontFamily: 'var(--font-mono)' }}
            stroke="var(--color-rule)"
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-rule)', strokeOpacity: 0.5 }} />
          <Area
            type="monotone"
            dataKey="cumVol"
            stroke="url(#bpStroke)"
            strokeWidth={2}
            fill="url(#bpFill)"
            dot={(props: any) => {
              const { cx, cy, payload } = props
              const color = BP_COLORS[payload.bp as BodyPart | 'other'] || BP_COLORS.other
              return <circle cx={cx} cy={cy} r={3} fill={color} stroke={color} key={`dot-${cx}-${cy}`} />
            }}
            activeDot={(props: any) => {
              const { cx, cy, payload } = props
              const color = BP_COLORS[payload.bp as BodyPart | 'other'] || BP_COLORS.other
              return <circle cx={cx} cy={cy} r={5} fill={color} stroke="var(--color-paper)" strokeWidth={2} key={`adot-${cx}-${cy}`} />
            }}
          />
        </AreaChart>
      </ChartWrapper>
      {legendBPs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {legendBPs.map(bp => (
            <div key={bp} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-ink-3)', textTransform: 'capitalize' }}>
              <span style={{ width: 10, height: 10, background: BP_COLORS[bp], display: 'inline-block' }} />
              {bp}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
