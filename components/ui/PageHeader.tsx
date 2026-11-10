import styles from './PageHeader.module.css'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  lead?: string
  rule?: boolean
  action?: React.ReactNode
}

export function PageHeader({ eyebrow, title, lead, rule = true, action }: PageHeaderProps) {
  const text = (
    <>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1 className={styles.title}>{title}</h1>
      {lead && <p className={styles.lead}>{lead}</p>}
    </>
  )

  return (
    <header className={styles.header}>
      {action ? (
        <div className={styles.withAction}>
          <div className={styles.text}>{text}</div>
          <div className={styles.action}>{action}</div>
        </div>
      ) : (
        text
      )}
      {rule && <hr className={styles.rule} />}
    </header>
  )
}
