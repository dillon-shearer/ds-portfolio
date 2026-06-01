'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import ChartWrapper from '@/components/dashboard/ChartWrapper'
import styles from './VolumeChart.module.css'

type Props = {
  data: { date: string; volume: number }[]
  height?: number
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  const v = Number(payload[0]?.value ?? 0)
  const dateStr = label ? new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
  return (
    <div style={{
      background: 'var(--color-ink)',
      color: 'var(--color-paper)',
      padding: 'var(--space-2) var(--space-3)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      whiteSpace: 'nowrap',
    }}>
      {dateStr && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-rule)' }}>{dateStr}</span>}
      <span style={{ fontWeight: '500', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>
        {Number.isFinite(v) ? v.toLocaleString() : 0} lbs
      </span>
    </div>
  )
}

export default function VolumeChart({ data, height = 200 }: Props) {
  return (
    <div className={styles.container}>
      <ChartWrapper height={height} isEmpty={data.length === 0}>
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 4, left: 40 }}>
          <CartesianGrid stroke="var(--color-rule-soft)" strokeOpacity={0.5} />
          <XAxis
            dataKey="date"
            tick={false}
            tickLine={false}
            stroke="var(--color-rule)"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-ink-3)', fontFamily: 'var(--font-sans)' }}
            stroke="var(--color-rule)"
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-accent)', strokeOpacity: 0.3 }} />
          <Area
            type="monotone"
            dataKey="volume"
            stroke="var(--chart-primary)"
            fill="var(--chart-primary)"
            strokeWidth={2}
            fillOpacity={0.12}
          />
        </AreaChart>
      </ChartWrapper>
    </div>
  )
}
