import type { Metadata } from 'next'
import { PageHeader, DashboardCard } from '@/components/ui'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Dashboards',
  description: 'A collection of data visualizations and analytics dashboards built across tools and domains.',
}

const dashboards = [
  {
    tool: 'Tableau',
    title: 'ALS Patient Outcomes',
    description: 'Tracks patient progression metrics and outcome distributions across clinical trial cohorts.',
    href: '#',
  },
]

export default function DashboardsPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        title="Dashboards"
        lead="A collection of data visualizations and analytics dashboards built across tools and domains."
      />
      <div className={styles.list}>
        {dashboards.map((d) => (
          <DashboardCard
            key={d.title}
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
