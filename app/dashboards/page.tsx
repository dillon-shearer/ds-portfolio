import type { Metadata } from 'next'
import { PageHeader, DashboardCard } from '@/components/ui'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Dashboards',
  description: 'A collection of data visualizations and analytics dashboards built across tools and domains.',
}

const dashboards = [
  {
    tool: 'Next.js + PostgreSQL',
    title: 'Gym Tracker',
    description: 'Personal training log with volume analytics, split tracking, exercise PRs, and an AI coaching assistant.',
    href: '/dashboards/gym',
  },
  {
    tool: 'Tableau',
    title: 'ALS Patient Outcomes',
    description: 'Tracks patient progression metrics and outcome distributions across clinical trial cohorts.',
    href: '/dashboards/coming-soon',
  },
]

export default function DashboardsPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        title="Dashboards"
        lead="A collection of data visualizations and analytics dashboards built across tools and domains."
        rule={false}
      />
      <div className={styles.list}>
        {dashboards.map((d) => (
          <DashboardCard
            key={`${d.tool}-${d.title}`}
            tool={d.tool}
            title={d.title}
            description={d.description}
            href={d.href}
          />
        ))}
      </div>
    </div>
  )
}
