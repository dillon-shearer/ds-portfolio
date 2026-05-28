import Pager from '@/components/dashboard/Pager'
import styles from './ExercisePRsTable.module.css'

type SortKey = 'exercise' | 'bestWeight' | 'best1RM' | 'bestSetDate'

type PRRow = {
  exercise: string
  bestWeight: number
  best1RM: number
  bestSetDate: string
  bestSet?: { weight: number; reps: number } | null
}

type Props = {
  rows: PRRow[]
  page: number
  totalPages: number
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (key: SortKey) => void
  onPrev: () => void
  onNext: () => void
}

function SortIndicator({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return null
  return <span>{dir === 'asc' ? ' ↑' : ' ↓'}</span>
}

export default function ExercisePRsTable({ rows, page, totalPages, sortKey, sortDir, onSort, onPrev, onNext }: Props) {
  const col = (key: SortKey, label: string) => (
    <th className={styles.th} onClick={() => onSort(key)} style={{ cursor: 'pointer' }}>
      {label}<SortIndicator active={sortKey === key} dir={sortDir} />
    </th>
  )

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {col('exercise', 'Exercise')}
              {col('bestWeight', 'Weight')}
              {col('best1RM', 'Est 1RM')}
              <th className={styles.th}>Best Set</th>
              {col('bestSetDate', 'Date')}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.exercise} className={i < rows.length - 1 ? styles.row : styles.rowLast}>
                <td className={styles.td}>{row.exercise}</td>
                <td className={[styles.td, styles.num].join(' ')}>{row.bestWeight} lbs</td>
                <td className={[styles.td, styles.num, styles.accent].join(' ')}>{row.best1RM} lbs</td>
                <td className={[styles.td, styles.num, styles.muted].join(' ')}>
                  {row.bestSet ? `${row.bestSet.weight} x ${row.bestSet.reps}` : '-'}
                </td>
                <td className={[styles.td, styles.num, styles.muted, styles.dateCell].join(' ')}>
                  {row.bestSetDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} totalPages={totalPages} onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
