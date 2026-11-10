export interface NavItem {
  label: string
  href: string
}

const JOB_TITLES = ['Data Scientist', 'Data Engineer', 'Data Analyst', 'AI Engineer']

export const SITE = {
  author: 'Dillon Shearer',
  title: 'Data With Dillon',
  positioning: 'Data Scientist and Data Engineer',
  homeTitle: 'Dillon Shearer | Data Scientist and Data Engineer',
  jobTitles: JOB_TITLES,
  description:
    'Dillon Shearer is a data scientist and data engineer in Newnan, GA who works remotely on analytics, pipelines, and AI tools for healthcare research.',
  url: 'https://datawithdillon.com',
  location: {
    locality: 'Newnan',
    region: 'GA',
    regionName: 'Georgia',
    country: 'US',
    workMode: 'Remote preferred, hybrid is fine.',
  },
  knowsAbout: [
    'Data science',
    'Data engineering',
    'Data analytics',
    'AI engineering',
    'ETL pipelines',
    'SQL',
    'Python',
    'PostgreSQL',
    'OMOP Common Data Model',
    'Healthcare data',
    'Clinical data standards',
    'Dashboards and data visualization',
    'Large language model tools',
  ],
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/demos', label: 'Demos' },
  { href: '/videos', label: 'Videos' },
  { href: '/contact', label: 'Contact' },
]

export const SOCIALS = {
  github: 'https://github.com/dillon-shearer',
  linkedin: 'https://www.linkedin.com/in/dillonshearer/',
  youtube: 'https://www.youtube.com/@DataWithDillon',
  email: 'dillon@datawithdillon.com',
  sourceRepo: 'https://github.com/dillon-shearer/ds-portfolio',
}

export const KEY_PAGES: { path: string; title: string; summary: string }[] = [
  { path: '/', title: 'Home', summary: 'Start page with links to the rest of the site.' },
  { path: '/about', title: 'About', summary: 'Background, current work at Answer ALS, resume links, and certifications.' },
  { path: '/resume', title: 'Resume', summary: 'Full resume as HTML, with a PDF download.' },
  { path: '/demos', title: 'Demos', summary: 'Projects you can open or read about.' },
  { path: '/demos/gym', title: 'Gym Tracker', summary: 'Live gym dashboard with analytics and an AI chat over the training data.' },
  { path: '/work/gym-tracker', title: 'Gym Tracker case study', summary: 'How the Gym Tracker AI chat queries Postgres safely.' },
  { path: '/videos', title: 'Videos', summary: 'Videos from the Data With Dillon YouTube channel, newest first.' },
  { path: '/colophon', title: 'Site notes', summary: 'How this site is built and deployed.' },
  { path: '/contact', title: 'Contact', summary: 'Contact form for project and work inquiries.' },
]
