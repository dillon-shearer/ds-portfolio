
export const DASHBOARDS_PAGE = {
  title: 'Demos',
} as const

export const DASHBOARDS: {
  title: string
  tool: string
  href?: string
  description: string
  tech: string[]
  caseStudy?: { href: string; label: string }
}[] = [
  {
    tool: 'Next.js + PostgreSQL',
    title: 'Gym Tracker',
    description:
      'Personal training log with volume analytics, split tracking, exercise PRs, and an AI coaching assistant.',
    href: '/demos/gym',
    tech: ['Next.js', 'PostgreSQL', 'Recharts', 'React Three Fiber', 'OpenAI'],
  },
  {
    tool: 'Python + Panel',
    title: 'Variant Report Tool',
    description:
      'Web app for exploring whole genome sequencing variant data in an ALS research data portal, running in production on Azure.',
    href: 'https://neuromine-variant-reports-prod.azurewebsites.net/home',
    tech: ['Python', 'Panel', 'Azure SQL', 'Azure Blob Storage', 'igv.js', 'Azure App Service'],
  },
  {
    tool: 'TypeScript + BullMQ',
    title: 'Reddit to Short-Form Video Pipeline',
    href: '/demos/reddit-pipeline',
    description:
      'Local pipeline that turns Reddit stories into narrated, captioned short-form videos and posts them on a schedule.',
    tech: ['TypeScript', 'Hono', 'BullMQ', 'SQLite', 'Drizzle', 'Kokoro TTS', 'faster-whisper'],
  },
]
