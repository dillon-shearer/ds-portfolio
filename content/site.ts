export interface NavItem {
  label: string
  href: string
}

export const SITE = {
  author: 'Dillon Shearer',
  title: 'Data With Dillon',
  description:
    'Data engineer and analyst building analytics, pipelines, and AI tooling for healthcare and life-science teams.',
  url: 'https://datawithdillon.com',
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/colophon', label: 'Colophon' },
  { href: '/dashboards', label: 'Dashboards' },
  { href: '/contact', label: 'Contact' },
]

export const SOCIALS = {
  github: 'https://github.com/dillon-shearer',
  linkedin: 'https://www.linkedin.com/in/dillonshearer/',
  email: 'dillon@datawithdillon.com',
  sourceRepo: 'https://github.com/dillon-shearer/ds-portfolio',
}
