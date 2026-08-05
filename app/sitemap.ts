import type { MetadataRoute } from 'next'
import { SITE } from '@/content/site'

const routes = ['/', '/about', '/contact', '/dashboards', '/dashboards/gym', '/rss']

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: new URL(route, SITE.url).toString(),
  }))
}
