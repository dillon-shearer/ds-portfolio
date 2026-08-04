import type { Metadata } from 'next'
import { PageHeader, Card, InlineLink } from '@/components/ui'
import { READERS, FEED } from '@/content/rss'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'RSS Feed',
  description: 'Subscribe to updates from Data With Dillon via RSS.',
}

export default function RssPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow="Subscribe"
        title="RSS Feed"
        lead="Follow site updates without social media."
      />

      <div className={styles.prose}>
        <p>
          RSS is an open format that lets you subscribe to websites and read their updates in one
          place, in your RSS reader, without visiting each site individually and without any
          algorithm deciding what you see.
        </p>
        <p>To subscribe, copy the feed URL below and paste it into your RSS reader:</p>
        <p>
          <InlineLink href={`${FEED.siteUrl}/rss/feed`}>{`${FEED.siteUrl}/rss/feed`}</InlineLink>
        </p>
        <p>Don&apos;t have an RSS reader yet? Here are a few good ones:</p>
      </div>

      <div className={styles.readers}>
        {READERS.map((r) => (
          <Card
            key={r.name}
            title={r.name}
            description={r.description}
            action={
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wide)',
                  color: 'var(--color-accent)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Visit site
              </a>
            }
          />
        ))}
      </div>
    </div>
  )
}
