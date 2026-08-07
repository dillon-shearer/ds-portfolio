import type { Metadata } from 'next'
import { InlineLink, PageHeader } from '@/components/ui'
import { COLOPHON_PAGE } from '@/content/colophon'
import styles from './page.module.css'

export const metadata: Metadata = COLOPHON_PAGE.metadata

export default function ColophonPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow={COLOPHON_PAGE.eyebrow}
        title={COLOPHON_PAGE.title}
        lead={COLOPHON_PAGE.lead}
      />

      <section className={styles.section} aria-labelledby="implementation-heading">
        <h2 id="implementation-heading" className={styles.sectionTitle}>
          Implementation notes
        </h2>
        <ol className={styles.entries}>
          {COLOPHON_PAGE.entries.map((entry) => (
            <li key={entry.label} className={styles.entry}>
              <p className={styles.label}>{entry.label}</p>
              <div>
                <h3 className={styles.entryTitle}>{entry.title}</h3>
                <p className={styles.description}>{entry.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.source} aria-labelledby="source-heading">
        <h2 id="source-heading" className={styles.sectionTitle}>
          {COLOPHON_PAGE.source.heading}
        </h2>
        <p className={styles.sourceDescription}>{COLOPHON_PAGE.source.description}</p>
        <InlineLink href={COLOPHON_PAGE.source.href} external>
          {COLOPHON_PAGE.source.linkLabel}
        </InlineLink>
      </section>
    </div>
  )
}
