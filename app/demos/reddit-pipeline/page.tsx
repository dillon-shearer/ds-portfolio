import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
import { REDDIT_PIPELINE } from '@/content/reddit-pipeline'
import { ChannelCarousel } from './ChannelCarousel'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: REDDIT_PIPELINE.metadataTitle,
  description: REDDIT_PIPELINE.metadataDescription,
}

export default function RedditPipelinePage() {
  return (
    <div className="page-wrapper--wide">
      <PageHeader
        eyebrow={REDDIT_PIPELINE.eyebrow}
        title={REDDIT_PIPELINE.title}
        lead={REDDIT_PIPELINE.lead}
        rule={false}
      />
      <p className={styles.description}>{REDDIT_PIPELINE.description}</p>
      <hr className={styles.rule} />
      <section className={styles.carousel}>
        <h2 className={styles.sectionLabel}>{REDDIT_PIPELINE.carouselLabel}</h2>
        <ChannelCarousel
          channels={REDDIT_PIPELINE.channels}
          ariaLabel={REDDIT_PIPELINE.carouselAriaLabel}
        />
      </section>
    </div>
  )
}
