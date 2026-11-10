import type { Metadata } from 'next'
import { Button, InlineLink } from '@/components/ui'
import { HERO } from '@/content/home'
import { SITE, SOCIALS } from '@/content/site'
import { CHANNEL, FALLBACK_VIDEOS, HOME_VIDEO_STRIP } from '@/content/videos'
import { VideoCard } from '@/components/videos/VideoCard'
import { loadVideos } from '@/lib/videos'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: { absolute: SITE.homeTitle },
  description: SITE.description,
}

export const revalidate = 3600

export default async function HomePage() {
  const [latest] = await loadVideos({ feedUrl: CHANNEL.feedUrl, fallback: FALLBACK_VIDEOS })

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
      {latest && (
        <section className={styles.strip} aria-labelledby="latest-video-heading" data-home-video-strip>
          <div className={styles.stripHead}>
            <h2 id="latest-video-heading" className={styles.stripTitle}>
              {HOME_VIDEO_STRIP.heading}
            </h2>
            <InlineLink href={HOME_VIDEO_STRIP.allHref}>{HOME_VIDEO_STRIP.allLabel}</InlineLink>
          </div>
          <VideoCard video={latest} layout="strip" headingLevel="h3" />
        </section>
      )}
    </div>
  )
}
