import Link from 'next/link'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <p className={styles.eyebrow}>404</p>
      <h1 className={styles.heading}>Page not found</h1>
      <p className={styles.message}>
        This page doesn't exist. It may have moved or been removed.
      </p>
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide)',
          color: 'var(--color-accent)',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
        }}
      >
        Back to home
      </Link>
    </div>
  )
}
