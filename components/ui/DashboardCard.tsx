'use client'

import { useState } from 'react'
import { Button } from './Button'
import styles from './DashboardCard.module.css'

interface DashboardCardProps {
  tool: string
  title: string
  description: string
  href: string
  longDescription?: string
  tech?: string[]
}

export function DashboardCard({
  tool,
  title,
  description,
  href,
  longDescription,
  tech,
}: DashboardCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = Boolean(longDescription) || (tech && tech.length > 0)

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>{tool}</p>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <div className={styles.actions}>
        <Button href={href} variant="outline">View Dashboard</Button>
        {hasMore ? (
          <Button
            variant="ghost"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'See less' : 'See more'}
          </Button>
        ) : null}
      </div>
      {hasMore ? (
        <div
          className={styles.expand}
          data-expanded={expanded}
          aria-hidden={!expanded}
        >
          <div className={styles.expandInner}>
            {longDescription ? (
              <p className={styles.long}>{longDescription}</p>
            ) : null}
            {tech && tech.length > 0 ? (
              <ul className={styles.tech}>
                {tech.map((t) => (
                  <li key={t} className={styles.tag}>{t}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
