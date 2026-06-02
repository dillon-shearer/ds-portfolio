import type { Metadata } from 'next'
import { Rule, Button, Card } from '@/components/ui'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Data With Dillon',
  description:
    'Data engineer and analyst working in healthcare and life science data.',
}

const capabilities = [
  {
    eyebrow: 'Core Work',
    title: 'Data pipelines',
    description:
      'Scheduled ingestion, data quality checks, and the boring reliability that makes everything downstream work. Mostly Python and SQL.',
    badges: ['Python', 'SQL', 'PostgreSQL'],
  },
  {
    eyebrow: 'Process',
    title: 'Documentation and standards',
    description:
      'Data dictionaries, SOPs, and terminology standards that keep teams on the same page. The work nobody prioritizes until something breaks.',
    badges: ['SNOMED', 'LOINC', 'OMOP'],
  },
  {
    eyebrow: 'Analysis',
    title: 'Analytics and reporting',
    description:
      'Recurring reports and operational dashboards in Tableau and Power BI. Turning pipeline output into something a researcher can actually read.',
    badges: ['Tableau', 'Power BI', 'Recharts'],
  },
  {
    eyebrow: 'When needed',
    title: 'Whatever the project needs',
    description:
      'Web apps, data quality testing, one-off tooling. Whatever sits between the pipeline and a finished product, I cover it.',
    badges: ['React', 'Next.js', 'Claude API'],
  },
]

export default function HomePage() {
  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.roleLabel}>Data Analyst · Engineer</p>
        <h1 className={styles.name}>Dillon Shearer</h1>
        <p className={styles.valueProp}>
          I do data work for healthcare and life science teams. Pipelines,
          analytics, and whatever else it takes to ship something useful.
        </p>
        <div className={styles.ctas}>
          <Button href="/contact" variant="primary">Get in touch</Button>
          <Button href="/about" variant="outline">About me</Button>
        </div>
      </section>

      {/* What I Do */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The work</h2>
        <div className={styles.cards}>
          {capabilities.map((cap) => (
            <Card
              key={cap.title}
              eyebrow={cap.eyebrow}
              title={cap.title}
              description={cap.description}
              badges={cap.badges}
            />
          ))}
        </div>
      </section>

    </div>
  )
}
