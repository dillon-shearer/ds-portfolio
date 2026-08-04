import type { Metadata } from 'next'
import { Fragment } from 'react'
import { PageHeader } from '@/components/ui'
import { LEAD } from '@/content/contact'
import { SOCIALS } from '@/content/site'
import { ContactForm } from './ContactForm'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Dillon Shearer for data engineering, analytics, or healthcare data projects.',
}

const ELSEWHERE_LINKS = [
  { label: 'Email', href: `mailto:${SOCIALS.email}` },
  { label: 'LinkedIn', href: SOCIALS.linkedin, external: true },
  { label: 'GitHub', href: SOCIALS.github, external: true },
]

export default function ContactPage() {
  return (
    <div className="page-wrapper">
      <PageHeader eyebrow="Contact" title="Get in touch" lead={LEAD} />

      <ContactForm />

      <section className={styles.elsewhere} aria-labelledby="elsewhere-heading">
        <h2 id="elsewhere-heading" className={styles.elsewhereTitle}>
          Elsewhere
        </h2>
        <div className={styles.linkRow}>
          {ELSEWHERE_LINKS.map((item, index) => (
            <Fragment key={item.label}>
              {index > 0 && <span className={styles.separator}> / </span>}
              <a
                href={item.href}
                className={styles.elsewhereLink}
                {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {item.label}
              </a>
            </Fragment>
          ))}
        </div>
      </section>
    </div>
  )
}
