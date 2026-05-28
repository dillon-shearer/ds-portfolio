import styles from './StatWidget.module.css'

type Props = {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

export default function StatWidget({ label, value, sub, accent }: Props) {
  return (
    <div className={styles.widget}>
      <p className={styles.label}>{label}</p>
      <p className={[styles.value, accent ? styles.accent : ''].join(' ')}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className={styles.sub}>{sub}</p>}
    </div>
  )
}
