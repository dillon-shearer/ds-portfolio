import { GYM_TRACKER_CASE_STUDY } from './gym-tracker'

export const DASHBOARDS_PAGE = {
  eyebrow: 'DASHBOARDS',
  title: 'Dashboards',
} as const

export const DASHBOARDS: {
  title: string
  tool: string
  href?: string
  description: string
  longDescription: string
  tech: string[]
  caseStudy?: { href: string; label: string }
}[] = [
  {
    tool: 'Next.js + PostgreSQL',
    title: 'Gym Tracker',
    description:
      'Personal training log with volume analytics, split tracking, exercise PRs, and an AI coaching assistant.',
    href: '/dashboards/gym',
    longDescription:
      'A personal training dashboard built on top of every workout I log. It tracks weekly volume, splits, body part frequency, and exercise PRs, and includes an interactive 3D body diagram plus an AI coach that answers questions directly against the lift database.',
    tech: ['Next.js', 'PostgreSQL', 'Recharts', 'React Three Fiber', 'OpenAI'],
    caseStudy: {
      href: GYM_TRACKER_CASE_STUDY.route,
      label: GYM_TRACKER_CASE_STUDY.dashboardLinkLabel,
    },
  },
  {
    tool: 'Python + Panel',
    title: 'Variant Report Tool',
    description:
      'Web app for exploring whole genome sequencing variant data in an ALS research data portal, running in production on Azure.',
    href: 'https://neuromine-variant-reports-prod.azurewebsites.net/home',
    longDescription:
      'Generates multi-sheet Excel variant reports for a chosen gene list and participant set, runs genotype-first lookups that turn a locus or rsID into the participants carrying that variant, and plots cohort variants side by side in an embedded igv.js genome browser. Access is gated by a portal handle, so no genomic data is reachable without one.',
    tech: ['Python', 'Panel', 'Azure SQL', 'Azure Blob Storage', 'igv.js', 'Azure App Service'],
  },
  {
    tool: 'TypeScript + BullMQ',
    title: 'Reddit to Short-Form Video Pipeline',
    description:
      'Local pipeline that turns Reddit stories into narrated, captioned short-form videos and posts them on a schedule.',
    longDescription:
      'Pulls candidate stories from subreddit RSS feeds, narrates them with Kokoro TTS, times captions with faster-whisper, composites the result over background video, and runs every stage through a BullMQ queue with a dashboard for run history and retries. Finished videos post to TikTok, YouTube, and Instagram on a schedule through each platform OAuth connection.',
    tech: ['TypeScript', 'Hono', 'BullMQ', 'SQLite', 'Drizzle', 'Kokoro TTS', 'faster-whisper'],
  },
]
