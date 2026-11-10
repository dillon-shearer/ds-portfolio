import { SOCIALS } from './site'

export type ColophonEntry = {
  label: string
  title: string
  description: string
}

export type ColophonPage = {
  metadata: {
    title: string
    description: string
  }
  eyebrow: string
  title: string
  lead: string
  entries: readonly ColophonEntry[]
  source: {
    heading: string
    description: string
    linkLabel: string
    href: string
  }
}

export const COLOPHON_PAGE = {
  metadata: {
    title: 'Site notes',
    description:
      'Notes on how Data With Dillon is built with Next.js, TypeScript, typed content, CSS Modules, and Vercel.',
  },
  eyebrow: 'SITE NOTES',
  title: 'Site notes',
  lead: 'A short record of the tools, constraints, and deployment path behind Data With Dillon.',
  entries: [
    {
      label: '01 / APPLICATION',
      title: 'Next.js 15 App Router',
      description:
        'The site uses the Next.js 15 App Router with TypeScript. Routes are server-rendered by default, with client components where interaction requires them.',
    },
    {
      label: '02 / CONTENT',
      title: 'Typed content modules',
      description:
        'Page copy lives in typed modules under content/. This keeps content separate from route composition and gives repeated structures a shared shape.',
    },
    {
      label: '03 / STYLING',
      title: 'CSS Modules and design tokens',
      description:
        'CSS Modules scope page styles. Shared color, type, spacing, border, and motion values live in styles/tokens.css.',
    },
    {
      label: '04 / SYSTEM',
      title: 'Studio Ledger',
      description:
        'The interface follows the locked Studio Ledger design system: paper, ink, hairlines, a restrained type scale, and compact index-list layouts.',
    },
    {
      label: '05 / CHECKS',
      title: 'CI gates',
      description:
        'Every change passes ESLint, the ASCII-only content check, and a production build before it ships.',
    },
    {
      label: '06 / DEPLOYMENT',
      title: 'Vercel',
      description:
        'The public site deploys on Vercel. The deployment reads the repository and publishes the Next.js application.',
    },
  ],
  source: {
    heading: 'Read the source',
    description:
      'The ds-portfolio repository is public. Read the application code, content modules, and design tokens on GitHub.',
    linkLabel: 'Open ds-portfolio on GitHub',
    href: SOCIALS.sourceRepo,
  },
} as const satisfies ColophonPage
