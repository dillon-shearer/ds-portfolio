import type { Metadata } from 'next'
import { Inter, Schibsted_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SiteChrome } from '@/components/SiteChrome'
import { SITE, SOCIALS } from '@/content/site'
import '@/styles/tokens.css'
import './globals.css'

const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['600'],
  variable: '--next-font-display',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--next-font-sans',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.title}`,
  },
  description: SITE.description,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.title,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: './',
    types: {
      'application/rss+xml': '/rss/feed',
    },
  },
}

const personId = `${SITE.url}#person`

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': personId,
      name: SITE.author,
      jobTitle: SITE.positioning,
      url: SITE.url,
      sameAs: [SOCIALS.github, SOCIALS.linkedin],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}#website`,
      name: SITE.title,
      url: SITE.url,
      publisher: {
        '@id': personId,
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${schibstedGrotesk.variable} ${inter.variable}`}
    >
      <body>
        <SiteChrome>{children}</SiteChrome>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  )
}
