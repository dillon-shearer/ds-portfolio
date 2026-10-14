import styles from './SplitFrequency.module.css'

type Props = {
  push: number
  pull: number
  legs: number
}

const SPLITS = [
  { key: 'push', label: 'Push', colorClass: 'push' },
  { key: 'pull', label: 'Pull', colorClass: 'pull' },
  { key: 'legs', label: 'Legs', colorClass: 'legs' },
] as const

export default function SplitFrequency({ push, pull, legs }: Props) {
  const counts = { push, pull, legs }
  return (
    <div className={styles.grid}>
      {SPLITS.map(({ key, label, colorClass }) => (
        <div key={key} className={[styles.tile, styles[colorClass]].join(' ')}>
          <p className={styles.label}>{label}</p>
          <p className={styles.count}>{counts[key]}</p>
          <p className={styles.unit}>days</p>
        </div>
      ))}
    </div>
  )
}
