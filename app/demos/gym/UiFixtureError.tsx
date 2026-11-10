import styles from './loading.module.css'

export default function UiFixtureError() {
  return (
    <div className={styles.state} data-ui-ready="gym-error" data-ui-state="error">
      <p role="alert">Unable to load the gym dashboard.</p>
    </div>
  )
}
