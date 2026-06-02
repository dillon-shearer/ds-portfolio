'use client'

import { useEffect, useState } from 'react'
import { ResponsiveContainer } from 'recharts'
import styles from './ChartWrapper.module.css'

type Props = {
  height?: number
  isEmpty?: boolean
  emptyMessage?: string
  children: React.ReactNode
}

export default function ChartWrapper({
  height = 200,
  isEmpty = false,
  emptyMessage = 'No data in this range',
  children,
}: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (isEmpty) {
    return (
      <div className={styles.empty} style={{ height }}>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    )
  }

  if (!mounted) {
    return <div className={styles.wrapper} style={{ height }} />
  }

  return (
    <div className={styles.wrapper} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  )
}
