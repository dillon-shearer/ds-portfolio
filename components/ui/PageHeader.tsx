import styles from './PageHeader.module.css'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  lead?: string
}

export function PageHeader({ eyebrow, title, lead }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1 className={styles.title}>{title}</h1>
      {lead && <p className={styles.lead}>{lead}</p>}
      <hr className={styles.rule} />
    </header>
  )
}
