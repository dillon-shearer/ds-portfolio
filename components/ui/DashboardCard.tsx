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
          <div className={styles.bar} style={{ height: '14px' }} />
          <div className={styles.bar} style={{ height: '22px' }} />
          <div className={styles.bar} style={{ height: '10px' }} />
          <div className={styles.bar} style={{ height: '18px' }} />
          <div className={styles.bar} style={{ height: '26px' }} />
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
