import type { Metadata } from 'next'
import { PageHeader, Rule } from '@/components/ui'
import { ContactForm } from './ContactForm'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Dillon Shearer for data engineering, analytics, or healthcare data projects.',
}

export default function ContactPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        lead="I'd love to hear from you. Send me a message and I'll respond as soon as possible."
      />

      <ContactForm />

      <Rule />

      <div className={styles.altLinks} style={{ marginTop: 'var(--space-6)' }}>
        <a href="mailto:dillon@datawithdillon.com" className={styles.altLink}>
          dillon@datawithdillon.com
        </a>
        <a
          href="https://www.linkedin.com/in/dillonshearer/"
          className={styles.altLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        <a
          href="https://github.com/dillon-shearer"
          className={styles.altLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
    </div>
  )
}
