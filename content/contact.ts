import { SOCIALS } from './site'

export const LEAD =
  "I'd love to hear from you. Send me a message and I'll respond as soon as possible."

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
