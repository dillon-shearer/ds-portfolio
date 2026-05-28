import { Button } from './Button'
import styles from './DashboardCard.module.css'

interface DashboardCardProps {
  tool: string
  title: string
  description: string
  href: string
}

export function DashboardCard({ tool, title, description, href }: DashboardCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.thumb} aria-hidden="true">
        <div className={styles.chart}>
          <div className={styles.bar} style={{ height: 14 }} />
          <div className={styles.bar} style={{ height: 22 }} />
          <div className={styles.bar} style={{ height: 10 }} />
          <div className={styles.bar} style={{ height: 18 }} />
          <div className={styles.bar} style={{ height: 26 }} />
        </div>
      </div>
      <div className={styles.content}>
        <p className={styles.eyebrow}>{tool}</p>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <Button href={href} variant="outline">View Dashboard</Button>
      </div>
    </div>
  )
}
