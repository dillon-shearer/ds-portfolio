import styles from './DashboardPanel.module.css'

type Props = {
  eyebrow?: string
  children: React.ReactNode
  className?: string
}

export default function DashboardPanel({ eyebrow, children, className }: Props) {
  return (
    <section className={[styles.panel, className].filter(Boolean).join(' ')}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      {children}
    </section>
  )
}
