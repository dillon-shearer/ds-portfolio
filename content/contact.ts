import { SOCIALS } from './site'

export const CONTACT_PAGE = {
  title: 'Get in touch',
  metadata: {
    title: 'Contact',
    description:
      'Contact Dillon Shearer about data science, data engineering, data analytics, or AI engineering projects. He lives in Newnan, GA and works remotely.',
  },
} as const

export const LEAD =
  "If you're hiring for data work or want to talk about a project, send a message. It goes straight to my inbox."

export const ELSEWHERE: {
  label: string
  href: string
  ariaLabel: string
  external?: boolean
}[] = [
  { label: 'Email', href: `mailto:${SOCIALS.email}`, ariaLabel: 'Send email' },
  { label: 'LinkedIn', href: SOCIALS.linkedin, ariaLabel: 'LinkedIn profile', external: true },
  { label: 'GitHub', href: SOCIALS.github, ariaLabel: 'GitHub profile', external: true },
]
