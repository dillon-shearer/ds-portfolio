import type { Metadata } from 'next'
import { PageHeader, DashboardCard } from '@/components/ui'
import { DASHBOARDS } from '@/content/dashboards'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Dashboards',
  description:
    'A collection of data visualizations and analytics dashboards built across tools and domains.',
}

export default function DashboardsPage() {
  return (
    <div className="page-wrapper--wide">
      <PageHeader
        eyebrow="Dashboards"
        title="Dashboards"
        lead="A collection of data visualizations and analytics dashboards built across tools and domains."
        rule={false}
      />
      <ol className={styles.list}>
        {DASHBOARDS.map((d, index) => (
          <DashboardCard
            key={`${d.tool}-${d.title}`}
            index={index + 1}
            tool={d.tool}
            title={d.title}
            description={d.description}
            href={d.href}
            longDescription={d.longDescription}
            tech={d.tech}
            caseStudy={d.caseStudy}
          />
        ))}
      </ol>
    </div>
  )
}
