import { NextResponse } from 'next/server'
import { FEED } from '@/content/rss'

export function GET() {
  const items = FEED.items
    .map(
      (item) => `    <item>
      <title>${item.title}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <description>${item.description}</description>
      <pubDate>${item.pubDate}</pubDate>
    </item>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${FEED.title}</title>
    <link>${FEED.siteUrl}</link>
    <description>${FEED.description}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${FEED.siteUrl}/rss/feed" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
