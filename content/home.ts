export const HERO = {
  eyebrow: 'DATA ANALYST / ENGINEER',
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

export const WORK_SECTION_TITLE = 'The work'

export const CAPABILITIES: {
  eyebrow: string
  title: string
  description: string
  tags: string[]
}[] = [
  {
    eyebrow: 'Core Work',
    title: 'Data pipelines',
    description:
      'Scheduled ingestion, data quality checks, and the boring reliability that makes everything downstream work. Mostly Python and SQL.',
    tags: ['Python', 'SQL', 'PostgreSQL'],
  },
  {
    eyebrow: 'Process',
    title: 'Documentation and standards',
    description:
      'Data dictionaries, SOPs, and terminology standards that keep teams on the same page. The work nobody prioritizes until something breaks.',
    tags: ['SNOMED', 'LOINC', 'OMOP'],
  },
  {
    eyebrow: 'Analysis',
    title: 'Analytics and reporting',
    description:
      'Recurring reports and operational dashboards in Tableau and Power BI. Turning pipeline output into something a researcher can actually read.',
    tags: ['Tableau', 'Power BI', 'Recharts'],
  },
  {
    eyebrow: 'When needed',
    title: 'Whatever the project needs',
    description:
      'Web apps, data quality testing, one-off tooling. Whatever sits between the pipeline and a finished product, I cover it.',
    tags: ['React', 'Next.js', 'Claude API'],
  },
]
