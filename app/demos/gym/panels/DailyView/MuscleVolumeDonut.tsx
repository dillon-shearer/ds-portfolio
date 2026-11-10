'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import type { GymLift } from '../../actions'
import { BP_COLORS, bodyPartForExercise, type BodyPart } from '@/lib/gym/body-parts'
import { setVolume } from '@/lib/gym/metrics'
import ChartWrapper from '@/components/dashboard/ChartWrapper'

type Props = { dayLifts: GymLift[] }

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const v = Number(p.value || 0)
  const datum = p?.payload || {}
  const total = datum.total || 1
  const pct = Math.round((v / total) * 100)
  return (
    <div
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper)',
        padding: 'var(--space-2) var(--space-3)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-xs)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          fontWeight: '500',
          letterSpacing: 'var(--tracking-wide)',
          textTransform: 'uppercase',
        }}
      >
        {p.name}: {v.toLocaleString()} lbs ({pct}%)
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-rule)' }}>
        {datum.sets ?? 0} sets
      </span>
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
      vols.set(bp, (vols.get(bp) || 0) + setVolume(l.weight, l.reps))
      sets.set(bp, (sets.get(bp) || 0) + 1)
    }
    const total = Array.from(vols.values()).reduce((s, v) => s + v, 0)
    const arr = Array.from(vols.entries())
      .map(([bp, volume]) => ({
        bp,
        name: bp,
        volume,
        sets: sets.get(bp) || 0,
        color: BP_COLORS[bp],
        total,
      }))
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
