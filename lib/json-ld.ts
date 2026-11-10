import { SITE, SOCIALS } from '@/content/site'
import { RESUME_PAGE } from '@/content/resume'

export const PERSON_ID = `${SITE.url}#person`
export const WEBSITE_ID = `${SITE.url}#website`

export type Crumb = { name: string; path: string }

const currentEmployer = RESUME_PAGE.experience.find((job) => job.dates.includes('Present'))?.employer

export function personJsonLd() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE.author,
    jobTitle: SITE.jobTitles,
    description: SITE.description,
    knowsAbout: SITE.knowsAbout,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.location.locality,
      addressRegion: SITE.location.region,
      addressCountry: SITE.location.country,
    },
    ...(currentEmployer ? { worksFor: { '@type': 'Organization', name: currentEmployer } } : {}),
    url: SITE.url,
    sameAs: [SOCIALS.github, SOCIALS.linkedin, SOCIALS.youtube],
  }
}

export function websiteJsonLd() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.title,
    url: SITE.url,
    publisher: { '@id': PERSON_ID },
  }
}

export function profilePageJsonLd(path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${new URL(path, SITE.url).toString()}#profile`,
    url: new URL(path, SITE.url).toString(),
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: { '@id': PERSON_ID },
  }
}

export function breadcrumbJsonLd(crumbs: readonly Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: new URL(crumb.path, SITE.url).toString(),
    })),
  }
}
