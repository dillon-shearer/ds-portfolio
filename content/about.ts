import { SITE } from './site'

export const BIO_PARAGRAPHS: string[] = [
  "After graduating with my MIS degree from UWG, I wasn't sure which direction to take my career. An internship as a QA/BA at a rare disease data platform opened my eyes to the impact that clean, well-structured data can have on real lives.",
  "That experience led me to my current role as a data scientist at Answer ALS, where I've been building production ETL pipelines, analytics systems, and AI tooling for ALS research ever since.",
  "What I love most about this work is the variety. Healthcare data challenges don't fit into neat categories, so I've embraced everything from building AI agents to creating executive dashboards to implementing data transformation tools.",
  "Behind every data point is a patient, a family, or a researcher working toward better treatments. That's what keeps me focused on getting it right.",
  "I believe the best data work happens when you combine technical rigor with genuine curiosity about the problems you're solving. I'm always learning something new, whether that's mastering a new tool, diving deeper into a domain, or finding better ways to communicate complex insights to diverse stakeholders.",
]

export const ABOUT_PAGE = {
  metadata: {
    title: 'About',
    description:
      `${SITE.positioning} building data systems, analytics, and applications focused on healthcare and life sciences.`,
  },
  eyebrow: 'ABOUT',
  title: 'Dillon Shearer',
  lead: `${SITE.positioning} building data systems, analytics, and applications focused on healthcare and life sciences.`,
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
    meta: 'APR 2025 / PHRP ONLINE TRAINING, INC.',
    credential: 'Credential ID: 3004648',
  },
]
