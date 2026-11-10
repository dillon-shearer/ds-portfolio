import styles from './TimeRangeSelector.module.css'

type Option = { label: string; value: string }

type Props = {
  options: Option[]
  value: string
  onChange: (value: string) => void
}

export default function TimeRangeSelector({ options, value, onChange }: Props) {
  return (
    <div className={styles.group} role="group" aria-label="Time range">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={[styles.btn, value === opt.value ? styles.active : ''].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
