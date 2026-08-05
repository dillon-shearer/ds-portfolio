import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
import { READERS } from '@/content/rss'
import { SITE } from '@/content/site'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'RSS Feed',
  description: 'Subscribe to updates from Data With Dillon via RSS.',
}

export default function RssPage() {
  const feedUrl = `${SITE.url}/rss/feed`

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
        <code
          className={styles.feedUrl}
          tabIndex={0}
          aria-label="RSS feed URL. Scroll horizontally to view the full address."
        >
          {feedUrl}
        </code>
        <p>Don&apos;t have an RSS reader yet? Here are a few good ones:</p>
      </div>

      <ul className={styles.readers}>
        {READERS.map((r) => (
          <li key={r.name} className={styles.reader}>
            <div>
              <h2 className={styles.readerName}>{r.name}</h2>
              <p className={styles.readerDescription}>{r.description}</p>
            </div>
            <div className={styles.readerAction}>
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.readerLink}
              >
                Visit site
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
