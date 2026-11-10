import Link from 'next/link'
import styles from './DashboardCard.module.css'

interface DashboardCardProps {
  tool: string
  title: string
  description: string
  href?: string
  tech?: string[]
  stats?: string
  caseStudy?: { href: string; label: string }
}

export function DashboardCard({
  tool,
  title,
  description,
  href,
  tech,
  stats,
  caseStudy,
}: DashboardCardProps) {
  return (
    <li className={styles.row}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          {!href ? (
            title
          ) : href.startsWith('http') ? (
            <a
              href={href}
              className={styles.titleLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {title}
            </a>
          ) : (
            <Link href={href} className={styles.titleLink}>
              {title}
            </Link>
          )}
        </h2>
        <p className={styles.tool}>{tool}</p>
        <p className={styles.description}>{description}</p>
        {tech && tech.length > 0 ? <p className={styles.tech}>{tech.join(', ')}</p> : null}
        {stats ? (
          <p className={styles.stats} data-dashboard-stats>
            {stats}
          </p>
        ) : null}
        {caseStudy ? (
          <Link href={caseStudy.href} className={styles.caseStudyLink}>
            {caseStudy.label}
          </Link>
        ) : null}
      </div>
    </li>
  )
}
