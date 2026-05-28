import Pager from '@/components/dashboard/Pager'
import styles from './BodyPartFrequency.module.css'

type BodyPartRow = { bp: string; sets: number }

type Props = {
  rows: BodyPartRow[]
  page: number
  totalPages: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export default function BodyPartFrequency({ rows, page, totalPages, total, onPrev, onNext }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.total}>{total} groups</span>
      </div>
      {rows.length === 0 ? (
        <p className={styles.empty}>No sets in this range</p>
      ) : (
        <div className={styles.chips}>
          {rows.map(({ bp, sets }) => (
            <div key={bp} className={styles.chip}>
              <span className={styles.chipLabel}>{bp.charAt(0).toUpperCase() + bp.slice(1)}</span>
              <span className={styles.chipCount}>{sets}</span>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <Pager page={page} totalPages={totalPages} onPrev={onPrev} onNext={onNext} />
      )}
    </div>
  )
}
