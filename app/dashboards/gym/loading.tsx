import styles from './loading.module.css'

export default function GymLoading() {
  return (
    <div className={styles.state} data-ui-ready="gym-loading" data-ui-state="loading">
      <div className={styles.spinner} aria-hidden="true" />
      <p role="status">Loading gym dashboard</p>
    </div>
  )
}
