import { SITE } from './site'

export const BIO_PARAGRAPHS: string[] = [
  "I graduated from UWG with an MIS degree and interned as a QA/BA at a rare disease data platform. That got me into healthcare data.",
  "From there I moved to Answer ALS as a data scientist, where I build production ETL pipelines, analytics systems, and AI tooling for ALS research.",
  "The job changes week to week. I've mapped clinical data to OMOP, built executive dashboards, and shipped internal AI tools, usually whatever the research effort needs next.",
  "Outside of work I'm usually building something anyway. This site and the gym dashboard on it are the current examples.",
]

export const ABOUT_PAGE = {
  metadata: {
    title: 'About',
    description:
      `${SITE.positioning} building data systems, analytics, and applications focused on healthcare and life sciences.`,
  },
  title: 'Dillon Shearer',
  lead: 'I work across the data lifecycle, mostly in healthcare and life sciences.',
  resume: {
    heading: 'Resume',
    intro: 'This is the current version.',
    formatLabel: 'PDF',
    downloadLabel: 'Download',
  },
  certifications: {
    heading: 'Certifications',
  },
} as const

export const RESUMES: { role: string; description: string; href: string; htmlHref: string }[] = [
  {
    role: 'Resume',
    description: 'Covers data engineering and analytics.',
    href: '/resumes/Dillon_Shearer_Resume.pdf',
    htmlHref: '/resume',
  },
]

export const CERTIFICATIONS: { title: string; meta: string; credential: string }[] = [
  {
    title: 'Protecting Human Research Participants',
    meta: 'Apr 2025 / PHRP Online Training, Inc.',
    credential: 'Credential ID: 3004648',
  },
]
