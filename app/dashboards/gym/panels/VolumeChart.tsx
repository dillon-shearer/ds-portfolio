'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import ChartWrapper from '@/components/dashboard/ChartWrapper'
import styles from './VolumeChart.module.css'

type Props = {
  data: { date: string; volume: number }[]
  height?: number
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null
  const v = Number(payload[0]?.value ?? 0)
  return (
    <div style={{
      background: 'var(--color-paper)',
      border: '1px solid var(--color-rule)',
      borderRadius: '2px',
      padding: '4px 8px',
      fontFamily: 'var(--font-sans)',
      fontSize: '12px',
      color: 'var(--color-ink)',
    }}>
      {Number.isFinite(v) ? v.toLocaleString() : 0} lbs
    </div>
  )
}

export default function VolumeChart({ data, height = 200 }: Props) {
  return (
    <div className={styles.container}>
      <ChartWrapper height={height} isEmpty={data.length === 0}>
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 24, left: 40 }}>
          <CartesianGrid stroke="var(--color-rule-soft)" strokeOpacity={0.5} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'var(--color-ink-3)', fontFamily: 'var(--font-sans)' }}
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
