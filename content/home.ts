import { SITE } from './site'

export const HERO = {
  eyebrow: SITE.positioning.toUpperCase(),
  statement: 'I do data work for healthcare and life science teams.',
  support: 'Pipelines, analytics, and whatever else it takes to ship something useful.',
  meta: {
    currently: 'CURRENTLY: DATA SCIENTIST, ANSWER ALS',
    separator: ' / ',
    github: 'GITHUB',
    linkedin: 'LINKEDIN',
  },
  ctas: {
    primary: { label: 'Get in touch', href: '/contact' },
    secondary: { label: 'About me', href: '/about' },
  },
}

export const WORK_SECTION = {
  eyebrow: 'The work',
  title: 'From source to delivery',
  description: 'I work from the source data through the finished output.',
  ariaLabel: 'Professional data work from source ingestion through delivery',
}

export const WORK_LIFECYCLE: {
  title: string
  description: string
  tags: string[]
}[] = [
  {
    title: 'Ingest and validate',
    description:
      'I build scheduled pipelines, monitor jobs, and add data quality checks before anyone depends on the output.',
    tags: ['Python', 'SQL', 'PostgreSQL'],
  },
  {
    title: 'Standardize and document',
    description:
      'I define terminology, maintain data dictionaries, and write SOPs so teams use the same data the same way.',
    tags: ['SNOMED', 'LOINC', 'OMOP'],
  },
  {
    title: 'Analyze and report',
    description:
      'I turn trusted data into analysis, dashboards, and recurring reports that researchers and operators can use.',
    tags: ['Tableau', 'Power BI', 'Recharts'],
  },
  {
    title: 'Ship',
    description:
      'I build the application or internal tool that closes the gap between the data and the person who needs it.',
    tags: ['React', 'Next.js', 'Claude API'],
  },
]
