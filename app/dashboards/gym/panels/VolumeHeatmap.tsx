'use client'

import { useLayoutEffect, useRef, useState } from 'react'

type Mode = 'week' | 'month' | 'year'
type Cell = { date: string; volume: number; label?: string }

// Portfolio color scale: paper-tone to oxblood
const PORTFOLIO_PALETTE = ['#EBE3D5', '#D8CFC2', '#8A7F71', '#4A4239', '#7A2E2E']

function interpolatePortfolioPalette(bucket: number): string {
  const idx = Math.max(0, Math.min(PORTFOLIO_PALETTE.length - 1, bucket))
  return PORTFOLIO_PALETTE[idx]
}

export default function VolumeHeatmap({
  data,
  mode = 'month',
  gap = 4,
  padding = 12,
  naColor = '#EBE3D5',
  minYearSegWidth = 10,
  fillParent = true,
}: {
  data: Cell[]
  mode?: Mode
  gap?: number
  padding?: number
  naColor?: string
  minYearSegWidth?: number
  fillParent?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState<number>(0)
  const [h, setH] = useState<number>(0)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0) setW(rect.width)
      if (rect.height > 0) setH(rect.height)
    }

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    window.addEventListener('resize', measure)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const N =
    mode === 'week' ? 7 :
    mode === 'month' ? 30 :
    Math.max(1, data.length)

  const series: Cell[] =
    data.length >= N
      ? data.slice(data.length - N)
      : [
          ...Array.from({ length: N - data.length }, (_, i) => ({
            date: `na-${i}`,
            volume: 0,
          })),
          ...data,
        ]

  const nonZero = series
    .filter(d => d.volume > 0)
    .map(d => d.volume)
    .sort((a, b) => a - b)

  const quantile = (arr: number[], p: number) => {
    if (!arr.length) return 0
    const idx = (arr.length - 1) * p
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    const t = idx - lo
    return (1 - t) * arr[lo] + t * arr[hi]
  }

  const q25 = quantile(nonZero, 0.25)
  const q50 = quantile(nonZero, 0.5)
  const q75 = quantile(nonZero, 0.75)

  const bucketFor = (v: number) => {
    if (nonZero.length <= 1) return 3
    if (v <= q25) return 1
    if (v <= q50) return 2
    if (v <= q75) return 3
    return 4
  }

  const colorFor = (d: Cell) => {
    if (d.volume === 0) return naColor
    return interpolatePortfolioPalette(bucketFor(d.volume))
  }

  const width = Math.max(1, w)
  const heightFromParent = Math.max(1, h)
  const innerW = Math.max(0, width - padding * 2)

  let cols: number
  let rows: number

  if (mode === 'year') {
    const maxCols = Math.max(1, Math.floor((innerW + gap) / (minYearSegWidth + gap)))
    cols = Math.max(1, Math.min(N, maxCols))
    rows = Math.max(1, Math.ceil(N / cols))
  } else {
    cols = N
    rows = 1
  }

  const totalGapX = Math.max(0, (cols - 1) * gap)
  const segW = cols > 0 ? (innerW - totalGapX) / cols : 0

  const totalGapY = Math.max(0, (rows - 1) * gap)
  let computedHeight: number
  let segH: number

  if (fillParent && heightFromParent > 0) {
    const innerH = Math.max(0, heightFromParent - padding * 2)
    segH = rows > 0 ? (innerH - totalGapY) / rows : 0
    computedHeight = heightFromParent
  } else {
    const targetSegH =
      mode === 'week' ? Math.min(segW, 36) :
      mode === 'month' ? Math.min(segW, 26) :
      Math.min(segW * 0.85, 28)
    segH = Math.max(8, targetSegH)
    computedHeight = Math.ceil(padding * 2 + rows * segH + totalGapY)
  }

  const rx = Math.min(2, Math.min(segW, segH) / 4)

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        width={width}
        height={computedHeight}
        viewBox={`0 0 ${width} ${computedHeight}`}
        role="img"
        aria-label="Volume heatmap"
        style={{ display: 'block' }}
      >
        {series.map((d, i) => {
          const r = Math.floor(i / cols)
          const c = i % cols
          const x = padding + c * (segW + gap)
          const y = padding + r * (segH + gap)
          return (
            <rect
              key={`${d.date}-${i}`}
              x={x}
              y={y}
              width={segW}
              height={segH}
              rx={rx}
              ry={rx}
              fill={colorFor(d)}
            />
          )
        })}
      </svg>
    </div>
  )
}
