import styles from './BodyPartFrequency.module.css'

type BodyPartRow = { bp: string; sets: number }

const CHIP_COLORS: Record<string, string> = {
  biceps:     'var(--chart-bp-biceps)',
  chest:      'var(--chart-bp-chest)',
  shoulders:  'var(--chart-bp-shoulders)',
  back:       'var(--chart-bp-back)',
  triceps:    'var(--chart-bp-triceps)',
  quads:      'var(--chart-bp-quads)',
  hamstrings: 'var(--chart-bp-hamstrings)',
  core:       'var(--chart-bp-core)',
  glutes:     'var(--chart-bp-glutes)',
  calves:     'var(--chart-bp-calves)',
  forearms:   'var(--chart-bp-forearms)',
  hips:       'var(--chart-bp-hips)',
}

type Props = { rows: BodyPartRow[] }

export default function BodyPartFrequency({ rows }: Props) {
  return (
    <div className={styles.container}>
      {rows.length === 0 ? (
        <p className={styles.empty}>No sets in this range</p>
      ) : (
        <div className={styles.chips}>
          {rows.map(({ bp, sets }) => (
            <div
              key={bp}
              className={styles.chip}
              style={{ borderLeftColor: CHIP_COLORS[bp] ?? 'var(--color-rule)' }}
            >
              <span className={styles.chipLabel}>{bp.charAt(0).toUpperCase() + bp.slice(1)}</span>
              <span className={styles.chipCount}>{sets}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
