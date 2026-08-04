'use client'

import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { GymLift } from '../../actions'
import { BP_COLORS, bodyPartForExercise, type BodyPart } from '@/lib/gym/body-parts'
import { setVolume } from '@/lib/gym/metrics'
import ChartWrapper from '@/components/dashboard/ChartWrapper'

type Props = { dayLifts: GymLift[] }

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
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
        {p.ex}
      </span>
      {p.bp !== 'other' && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-rule)',
            textTransform: 'capitalize',
          }}
        >
          {p.bp}
        </span>
      )}
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-rule)' }}>
        {Number(p.cumVol).toLocaleString()} lbs cumulative
      </span>
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
      cum += setVolume(l.weight, l.reps)
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
    for (const p of series) {
      if (p.bp !== 'other') bpSet.add(p.bp)
    }

    return { cumSeries: series, bpStops: stops, legendBPs: Array.from(bpSet) }
  }, [dayLifts])

  return (
    <div>
      <ChartWrapper height={240} isEmpty={cumSeries.length === 0} emptyMessage="No sets logged">
        <AreaChart data={cumSeries} margin={{ top: 10, right: 8, bottom: 24, left: 40 }}>
          <defs>
            <linearGradient id="bpStroke" x1="0" y1="0" x2="1" y2="0">
              {bpStops.map((s) => (
                <stop key={s.key} offset={`${s.offset}%`} stopColor={s.color} />
              ))}
            </linearGradient>
            <linearGradient id="bpFill" x1="0" y1="0" x2="1" y2="0">
              {bpStops.map((s) => (
                <stop
                  key={`${s.key}-f`}
                  offset={`${s.offset}%`}
                  stopColor={s.color}
                  stopOpacity={0.15}
                />
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
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: 'var(--color-rule)', strokeOpacity: 0.5 }}
          />
          <Area
            type="monotone"
            dataKey="cumVol"
            stroke="url(#bpStroke)"
            strokeWidth={2}
            fill="url(#bpFill)"
            dot={(props: any) => {
              const { cx, cy, payload } = props
              const color = BP_COLORS[payload.bp as BodyPart | 'other'] || BP_COLORS.other
              return (
                <circle cx={cx} cy={cy} r={3} fill={color} stroke={color} key={`dot-${cx}-${cy}`} />
              )
            }}
            activeDot={(props: any) => {
              const { cx, cy, payload } = props
              const color = BP_COLORS[payload.bp as BodyPart | 'other'] || BP_COLORS.other
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={color}
                  stroke="var(--color-paper)"
                  strokeWidth={2}
                  key={`adot-${cx}-${cy}`}
                />
              )
            }}
          />
        </AreaChart>
      </ChartWrapper>
      {legendBPs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {legendBPs.map((bp) => (
            <div
              key={bp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                color: 'var(--color-ink-3)',
                textTransform: 'capitalize',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  background: BP_COLORS[bp],
                  display: 'inline-block',
                }}
              />
              {bp}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
