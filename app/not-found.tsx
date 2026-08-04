import { InlineLink } from '@/components/ui'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <p className={styles.eyebrow}>404</p>
      <h1 className={styles.heading}>Page not found</h1>
      <p className={styles.message}>
        This page doesn&apos;t exist. It may have moved or been removed.
      </p>
      <span className={styles.homeLink}>
        <InlineLink href="/">Back to home</InlineLink>
      </span>
    </div>
  )
}
