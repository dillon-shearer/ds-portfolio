import styles from './Pager.module.css'

type Props = {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export default function Pager({ page, totalPages, onPrev, onNext }: Props) {
  return (
    <div className={styles.pager}>
      <button
        className={styles.btn}
        onClick={onPrev}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        &larr; Prev
      </button>
      <span className={styles.count}>{page} / {Math.max(1, totalPages)}</span>
      <button
        className={styles.btn}
        onClick={onNext}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        Next &rarr;
      </button>
    </div>
  )
}
