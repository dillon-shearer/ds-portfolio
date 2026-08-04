import type { Metadata } from 'next'
import { PageHeader, Card, Button } from '@/components/ui'
import { BIO_PARAGRAPHS, RESUMES, CERTIFICATIONS } from '@/content/about'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Data-centric software engineer building data systems, analytics, and applications. Currently focused on healthcare and life sciences.',
}

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
        {BIO_PARAGRAPHS.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      {/* Resumes */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Resumes</h2>
        <p className={styles.sectionIntro}>
          Role-specific resumes available for download. Each is tailored to a different position
          type.
        </p>
        <div className={styles.cards}>
          {RESUMES.map((r) => (
            <Card
              key={r.role}
              eyebrow={`Resume / ${r.role}`}
              title={r.role}
              description={r.description}
              action={
                <Button href={r.href} variant="outline" download>
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
        <p className={styles.sectionIntro}>Completed certifications and training programs.</p>
        <div className={styles.cards}>
          {CERTIFICATIONS.map((c) => (
            <Card
              key={c.title}
              eyebrow={c.meta}
              title={c.title}
              description={`Credential ID: ${c.credentialId}`}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
