import { GYM_TRACKER_CASE_STUDY } from './gym-tracker'

export const DASHBOARDS_PAGE = {
  eyebrow: 'DASHBOARDS',
  title: 'Dashboards',
} as const

export const DASHBOARDS: {
  title: string
  tool: string
  href: string
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
]
