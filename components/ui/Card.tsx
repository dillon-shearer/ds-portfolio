import styles from './Card.module.css'
import { Badge } from './Badge'

interface CardProps {
  eyebrow?: string
  title: string
  description?: string
  badges?: string[]
  action?: React.ReactNode
}

export function Card({ eyebrow, title, description, badges, action }: CardProps) {
  return (
    <div className={styles.card}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {badges && badges.length > 0 && (
        <div className={styles.badges}>
          {badges.slice(0, 3).map((b) => (
            <Badge key={b}>{b}</Badge>
          ))}
        </div>
      )}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
