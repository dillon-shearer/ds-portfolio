import Link from 'next/link'
import styles from './DashboardCard.module.css'

interface DashboardCardProps {
  index?: number
  tool: string
  title: string
  description: string
  href: string
  longDescription?: string
  tech?: string[]
}

export function DashboardCard({
  index,
  tool,
  title,
  description,
  href,
  longDescription,
  tech,
}: DashboardCardProps) {
  return (
    <li className={styles.row}>
      <span className={styles.index} aria-hidden="true">
        {String(index ?? 1).padStart(2, '0')}
      </span>
      <div className={styles.content}>
        <h2 className={styles.title}>
          <Link href={href} className={styles.titleLink}>
            {title}
          </Link>
        </h2>
        <p className={styles.tool}>{tool}</p>
        <p className={styles.description}>{description}</p>
        {longDescription ? <p className={styles.longDescription}>{longDescription}</p> : null}
        {tech && tech.length > 0 ? (
          <ul className={styles.tech}>
            {tech.map((item) => (
              <li key={item} className={styles.tag}>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  )
}
