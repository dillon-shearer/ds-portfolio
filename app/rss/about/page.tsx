import type { Metadata } from 'next'
import { PageHeader, Card, InlineLink } from '@/components/ui'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'RSS Feed',
  description: 'Subscribe to updates from Data With Dillon via RSS.',
}

const readers = [
  { title: 'Feedly', description: 'Web-based, free tier available.', href: 'https://feedly.com' },
  { title: 'NetNewsWire', description: 'Free, open source, Mac and iOS.', href: 'https://netnewswire.com' },
  { title: 'Reeder', description: 'Mac and iOS, polished reading experience.', href: 'https://reederapp.com' },
]

export default function RssAboutPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow="Subscribe"
        title="RSS Feed"
        lead="Follow site updates without social media."
      />

      <div className={styles.prose}>
        <p>
          RSS is an open format that lets you subscribe to websites and read their
          updates in one place — your RSS reader — without visiting each site individually
          and without any algorithm deciding what you see.
        </p>
        <p>
          To subscribe, copy the feed URL below and paste it into your RSS reader:
        </p>
        <p>
          <InlineLink href="https://datawithdillon.com/rss">
            https://datawithdillon.com/rss
          </InlineLink>
        </p>
        <p>
          Don't have an RSS reader yet? Here are a few good ones:
        </p>
      </div>

      <div className={styles.readers}>
        {readers.map((r) => (
          <Card
            key={r.title}
            title={r.title}
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
