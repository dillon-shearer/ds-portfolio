import { PageHeader } from '@/components/ui'
import styles from './loading.module.css'

export default function GymLoading() {
  return (
    <div className="page-wrapper--wide" data-ui-ready="gym-loading" data-ui-state="loading">
      <PageHeader
        eyebrow="Demos"
        title="Gym Tracker"
        lead="Personal training log, volume analytics, and AI coaching."
        rule={false}
      />
      <div className={styles.state}>
        <div className={styles.spinner} aria-hidden="true" />
        <p role="status">Loading gym dashboard</p>
        <div className={styles.skeleton} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}
