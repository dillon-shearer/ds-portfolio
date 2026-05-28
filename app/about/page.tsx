import type { Metadata } from 'next'
import { PageHeader, Card, Button } from '@/components/ui'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Data-centric software engineer building data systems, analytics, and applications. Currently focused on healthcare and life sciences.',
}

const resumes = [
  {
    eyebrow: 'Resume · Data Engineer',
    title: 'Data Engineer',
    description: 'Pipelines, infrastructure, and data reliability.',
    file: '/resumes/Dillon_Shearer_Resume.pdf',
  },
  {
    eyebrow: 'Resume · Data Analyst',
    title: 'Data Analyst',
    description: 'Analytics, dashboards, and business intelligence.',
    file: '/resumes/Dillon_Shearer_Resume.pdf',
  },
]

const certifications = [
  {
    eyebrow: 'Apr 2025 · PHRP Online Training, Inc.',
    title: 'Protecting Human Research Participants',
    description: 'Credential ID: 3004648',
  },
]

export default function AboutPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow="About"
        title="Dillon Shearer"
        lead="Data-centric software engineer building data systems, analytics, and applications. Currently focused on healthcare and life sciences."
      />

      {/* Bio */}
      <div className={styles.prose}>
        <p>
          After graduating with my MIS degree from UWG, I wasn't sure which direction
          to take my career. An internship as a QA/BA at a rare disease data platform
          opened my eyes to the impact that clean, well-structured data can have on real lives.
        </p>
        <p>
          That experience led me to my current role as a data scientist at Answer ALS,
          where I've been building production ETL pipelines, analytics systems, and
          AI tooling for ALS research ever since.
        </p>
        <p>
          What I love most about this work is the variety. Healthcare data challenges
          don't fit into neat categories, so I've embraced everything from building
          AI agents to creating executive dashboards to implementing data transformation tools.
        </p>
        <p>
          Behind every data point is a patient, a family, or a researcher working toward
          better treatments. That's what keeps me focused on getting it right.
        </p>
        <p>
          I believe the best data work happens when you combine technical rigor
          with genuine curiosity about the problems you're solving. I'm always learning
          something new, whether that's mastering a new tool, diving deeper into a domain,
          or finding better ways to communicate complex insights to diverse stakeholders.
        </p>
      </div>

      {/* Resumes */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Resumes</h2>
        <p className={styles.sectionIntro}>
          Role-specific resumes available for download. Each is tailored to a different
          position type.
        </p>
        <div className={styles.cards}>
          {resumes.map((r) => (
            <Card
              key={r.title}
              eyebrow={r.eyebrow}
              title={r.title}
              description={r.description}
              action={
                <Button href={r.file} variant="outline" download>
                  Download PDF
                </Button>
              }
            />
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Certifications</h2>
        <p className={styles.sectionIntro}>
          Completed certifications and training programs.
        </p>
        <div className={styles.cards}>
          {certifications.map((c) => (
            <Card
              key={c.title}
              eyebrow={c.eyebrow}
              title={c.title}
              description={c.description}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
