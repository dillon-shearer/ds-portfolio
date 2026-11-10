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
          <div className={styles.ctas} data-hero-actions>
            <Button href={HERO.ctas.primary.href} variant="primary" size="md">
              {HERO.ctas.primary.label}
            </Button>
            {HERO.ctas.secondary.map((link) => (
              <InlineLink key={link.href} href={link.href}>
                {link.label}
              </InlineLink>
            ))}
            <InlineLink href={SOCIALS.github} external>
              {HERO.ctas.social.github}
            </InlineLink>
            <InlineLink href={SOCIALS.linkedin} external>
              {HERO.ctas.social.linkedin}
            </InlineLink>
          </div>
        </div>
      </section>
    </div>
  )
}
