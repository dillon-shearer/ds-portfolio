import type { Metadata } from 'next'
import { Badge, Button, InlineLink } from '@/components/ui'
import { HERO, WORK_LIFECYCLE, WORK_SECTION } from '@/content/home'
import { SITE, SOCIALS } from '@/content/site'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: { absolute: `${SITE.author} | ${SITE.positioning}` },
  description: SITE.description,
}

export default function HomePage() {
  return (
    <div className="page-wrapper--wide">
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{HERO.eyebrow}</p>
        <div className={styles.heroGrid}>
          <h1 className={styles.statement}>{HERO.statement}</h1>
          <p className={styles.support}>{HERO.support}</p>
          <div className={styles.meta}>
            <span>{HERO.meta.currently}</span>
            <span aria-hidden="true">{HERO.meta.separator}</span>
            <a
              href={SOCIALS.github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.metaLink}
            >
              {HERO.meta.github}
            </a>
            <span aria-hidden="true">{HERO.meta.separator}</span>
            <a
              href={SOCIALS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.metaLink}
            >
              {HERO.meta.linkedin}
            </a>
          </div>
          <div className={styles.ctas}>
            <Button href={HERO.ctas.primary.href} variant="primary">
              {HERO.ctas.primary.label}
            </Button>
            <InlineLink href={HERO.ctas.secondary.href}>{HERO.ctas.secondary.label}</InlineLink>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.workHeader}>
          <p className={styles.workEyebrow}>{WORK_SECTION.eyebrow}</p>
          <h2 className={styles.sectionTitle}>{WORK_SECTION.title}</h2>
          <p className={styles.workLead}>{WORK_SECTION.description}</p>
        </header>
        <ol className={styles.workLifecycle} aria-label={WORK_SECTION.ariaLabel}>
          {WORK_LIFECYCLE.map((stage, index) => (
            <li key={stage.title} className={styles.lifecycleStep}>
              <div className={styles.stageMeta} aria-hidden="true">
                <span className={styles.stageDot} />
                <span className={styles.indexNumber}>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className={styles.workContent}>
                <h3 className={styles.workTitle}>{stage.title}</h3>
                <p className={styles.workDescription}>{stage.description}</p>
                <div className={styles.tags}>
                  {stage.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
