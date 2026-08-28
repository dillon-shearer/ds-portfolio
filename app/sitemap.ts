import type { MetadataRoute } from 'next'
import { SITE } from '@/content/site'

const routes = [
  '/',
  '/about',
  '/colophon',
  '/resume',
  '/contact',
  '/demos',
  '/demos/gym',
  '/demos/reddit-pipeline',
  '/work/gym-tracker',
  '/rss',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return routes.map((route) => ({
    url: new URL(route, SITE.url).toString(),
    lastModified,
  }))
}
