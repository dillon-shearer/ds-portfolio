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
  if (isEmpty) {
    return (
      <div className={styles.empty} style={{ height }}>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  )
}
