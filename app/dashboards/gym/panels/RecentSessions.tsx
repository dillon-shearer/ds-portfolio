import Pager from '@/components/dashboard/Pager'
import styles from './RecentSessions.module.css'

type Session = {
  date: string
  volume: number
  exercises: string[]
  sets: number
  dayTag: string | null
}

type Props = {
  rows: Session[]
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  onJumpToDay: (date: string) => void
}

function formatLongDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function titleCaseTag(tag: string) {
  return tag.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

export default function RecentSessions({ rows, page, totalPages, onPrev, onNext, onJumpToDay }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Pager page={page} totalPages={totalPages} onPrev={onPrev} onNext={onNext} />
      </div>
      <div className={styles.grid}>
        {rows.map((s) => (
          <button
            key={s.date}
            type="button"
            onClick={() => onJumpToDay(s.date)}
            className={styles.card}
            aria-label={`View ${formatLongDate(s.date)}`}
            title="Click to view day breakdown"
          >
            <p className={styles.date}>{formatLongDate(s.date)}</p>
            {s.dayTag && (
              <p className={styles.tag}>{titleCaseTag(s.dayTag)}</p>
            )}
            <p className={styles.meta}>
              {s.exercises.length} ex · {s.sets} sets · {s.volume.toLocaleString()} lbs
            </p>
          </button>
        ))}
      </div>
      <p className={styles.hint}>Click any session to view day breakdown</p>
    </div>
  )
}
