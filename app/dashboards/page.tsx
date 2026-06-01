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
    longDescription:
      'A personal training dashboard built on top of every workout I log. It tracks weekly volume, splits, body part frequency, exercise PRs, and an interactive 3D body diagram, plus an AI coach that can answer questions directly against the lift database.',
    tech: ['Next.js', 'PostgreSQL', 'Recharts', 'React Three Fiber', 'OpenAI'],
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
            longDescription={d.longDescription}
            tech={d.tech}
          />
        ))}
      </div>
    </div>
  )
}
