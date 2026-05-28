import styles from './PageHeader.module.css'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  lead?: string
  rule?: boolean
}

export function PageHeader({ eyebrow, title, lead, rule = true }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1 className={styles.title}>{title}</h1>
      {lead && <p className={styles.lead}>{lead}</p>}
      {rule && <hr className={styles.rule} />}
    </header>
  )
}
