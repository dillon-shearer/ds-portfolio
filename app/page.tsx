import type { Metadata } from 'next'
import { Rule, Button, Card } from '@/components/ui'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Data With Dillon',
  description:
    'Data engineer and analyst building analytics, pipelines, and AI tooling for healthcare and life-science teams.',
}

const capabilities = [
  {
    eyebrow: 'Core Focus',
    title: 'Full-Stack Data Engineering',
    description:
      'I design controlled intake flows and deploy production analytics that ingest daily, surface anomalies, and stay accurate long after the go-live meeting.',
    badges: ['Python', 'SQL', 'PostgreSQL'],
  },
  {
    eyebrow: 'Capability',
    title: 'Automation & AI',
    description:
      'Embed automation and assistant workflows that remove repetitive reporting and give operators answers on demand.',
    badges: ['ETL', 'Claude API', 'GitHub Actions'],
  },
  {
    eyebrow: 'Specialization',
    title: 'Healthcare Standards',
    description:
      'Maintain vocabularies, mappings, and documentation so downstream models and dashboards always speak the same language.',
    badges: ['SNOMED', 'LOINC', 'OMOP'],
  },
  {
    eyebrow: 'Toolkit',
    title: 'Technical Stack',
    description:
      'Full-stack capabilities across data engineering, analytics, and web development.',
    badges: ['Tableau', 'Power BI', 'React'],
  },
]

export default function HomePage() {
  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.roleLabel}>Data Engineer · Analyst</p>
        <h1 className={styles.name}>Dillon Shearer</h1>
        <p className={styles.valueProp}>
          Data-centric software engineer working end to end across the data
          lifecycle. Currently building analytics, pipelines, and AI tooling for
          healthcare and life-science teams.
        </p>
        <div className={styles.ctas}>
          <Button href="/contact" variant="primary">Get in touch</Button>
          <Button href="/about" variant="outline">About me</Button>
        </div>
      </section>

      <Rule weight="medium" />

      {/* What I Do */}
      <section className={styles.section}>
        <p className={styles.sectionEyebrow}>What I Do</p>
        <h2 className={styles.sectionTitle}>End-to-end data work</h2>
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

      <Rule weight="medium" />

      {/* Currently */}
      <p className={styles.currently}>
        Currently: Data scientist at Answer ALS, building analytics and pipelines for ALS research.
      </p>
    </div>
  )
}
