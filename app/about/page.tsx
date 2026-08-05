import type { Metadata } from 'next'
import { PageHeader, Button } from '@/components/ui'
import { ABOUT_PAGE, BIO_PARAGRAPHS, RESUMES, CERTIFICATIONS } from '@/content/about'
import styles from './page.module.css'

export const metadata: Metadata = ABOUT_PAGE.metadata

export default function AboutPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow={ABOUT_PAGE.eyebrow}
        title={ABOUT_PAGE.title}
        lead={ABOUT_PAGE.lead}
      />

      <div className={styles.prose}>
        {BIO_PARAGRAPHS.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{ABOUT_PAGE.resume.heading}</h2>
        <p className={styles.sectionIntro}>{ABOUT_PAGE.resume.intro}</p>
        <ul className={styles.ledgerList}>
          {RESUMES.map((r) => (
            <li key={r.role} className={styles.resumeRow}>
              <p className={styles.meta}>{ABOUT_PAGE.resume.formatLabel}</p>
              <div className={styles.rowContent}>
                <h3 className={styles.rowTitle}>{r.role}</h3>
                <p className={styles.rowDescription}>{r.description}</p>
              </div>
              <Button href={r.href} variant="outline" download>
                {ABOUT_PAGE.resume.downloadLabel}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{ABOUT_PAGE.certifications.heading}</h2>
        <ul className={styles.ledgerList}>
          {CERTIFICATIONS.map((c) => (
            <li key={c.title} className={styles.certificationRow}>
              <div className={styles.rowContent}>
                <p className={styles.meta}>{c.meta}</p>
                <h3 className={styles.certificationTitle}>{c.title}</h3>
                <p className={styles.credential}>{c.credential}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
