import { SITE } from './site'

export const READERS: { name: string; href: string; description: string }[] = [
  { name: 'Feedly', description: 'Web-based, free tier available.', href: 'https://feedly.com' },
  { name: 'NetNewsWire', description: 'Free, open source, Mac and iOS.', href: 'https://netnewswire.com' },
  { name: 'Reeder', description: 'Mac and iOS, polished reading experience.', href: 'https://reederapp.com' },
]

export const FEED = {
  title: SITE.title,
  description: SITE.description,
  siteUrl: SITE.url,
  items: [
    {
      title: 'Site launched',
      description: 'datawithdillon.com rebuilt with a print-editorial design system.',
      pubDate: 'Tue, 27 May 2026 00:00:00 +0000',
      link: SITE.url,
    },
  ],
}
