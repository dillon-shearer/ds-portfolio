import type { Metadata } from 'next'
import Link from 'next/link'
import { GYM_TRACKER_CASE_STUDY } from '@/content/gym-tracker'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: GYM_TRACKER_CASE_STUDY.metadataTitle,
  description: GYM_TRACKER_CASE_STUDY.metadataDescription,
}

export default function GymTrackerCaseStudyPage() {
  const content = GYM_TRACKER_CASE_STUDY

  return (
    <div className="page-wrapper">
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{content.eyebrow}</p>
        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.lead}>{content.lead}</p>
        <div className={styles.statGrid} aria-label={content.statsAriaLabel}>
          {content.stats.map((stat) => (
            <div className={styles.stat} key={stat.label}>
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statDetail}>{stat.detail}</p>
            </div>
          ))}
        </div>
      </header>

      <main className={styles.body}>
        <div className={styles.sections}>
          {content.sections.map((section, index) => (
            <section className={styles.section} key={section.eyebrow}>
              <div className={styles.sectionIndex} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className={styles.sectionContent}>
                <p className={styles.sectionEyebrow}>{section.eyebrow}</p>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <div className={styles.copy}>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <ul className={styles.sectionSources}>
                  {section.sourceLabels.map((sourceLabel) => (
                    <li key={sourceLabel}>{sourceLabel}</li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>

        <section className={styles.sources} aria-labelledby="source-heading">
          <p className={styles.sectionEyebrow}>SOURCE INDEX</p>
          <h2 className={styles.sourceTitle} id="source-heading">
            {content.sourceHeading}
          </h2>
          <p className={styles.sourceIntro}>{content.sourceIntro}</p>
          <ul className={styles.sourceList}>
            {content.sources.map((source, index) => (
              <li className={styles.sourceRow} key={source.href}>
                <span className={styles.sourceIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <a
                    className={styles.sourceLink}
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${content.sourceAriaLabel}: ${source.label}`}
                  >
                    {source.label}
                  </a>
                  <p className={styles.sourceDetail}>{source.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <nav className={styles.related} aria-label={content.relatedAriaLabel}>
          <Link className={styles.relatedLink} href={content.dashboardLinkHref}>
            {content.dashboardLinkLabel}
          </Link>
          <Link className={styles.relatedLink} href="/dashboards">
            {content.backToDashboardsLabel}
          </Link>
        </nav>
      </main>
    </div>
  )
}
