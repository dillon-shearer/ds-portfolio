import { NextResponse } from 'next/server'

const SITE_URL = 'https://datawithdillon.com'
const SITE_TITLE = 'Data With Dillon'
const SITE_DESCRIPTION =
  'Data engineer and analyst building analytics, pipelines, and AI tooling for healthcare and life-science teams.'

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss/feed" rel="self" type="application/rss+xml" />
    <item>
      <title>Site launched</title>
      <link>${SITE_URL}</link>
      <guid isPermaLink="true">${SITE_URL}</guid>
      <description>datawithdillon.com rebuilt with a print-editorial design system.</description>
      <pubDate>Tue, 27 May 2026 00:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
