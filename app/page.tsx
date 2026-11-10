import type { Metadata } from 'next'
import { Button, InlineLink } from '@/components/ui'
import { HERO } from '@/content/home'
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
        <div className={styles.heroGrid}>
          <h1 className={styles.statement}>{HERO.statement}</h1>
          <p className={styles.support}>{HERO.support}</p>
          <div className={styles.meta}>
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
            {HERO.ctas.secondary.map((link) => (
              <InlineLink key={link.href} href={link.href}>
                {link.label}
              </InlineLink>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
