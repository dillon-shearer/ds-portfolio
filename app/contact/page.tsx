import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
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

      <div className={styles.elsewhere}>
        <p className={styles.elsewhereTitle}>Elsewhere</p>
        <div className={styles.contactGrid}>
          <div className={styles.contactItem}>
            <p className={styles.contactLabel}>Email</p>
            <a href="mailto:dillon@datawithdillon.com" className={styles.contactValue}>
              dillon@datawithdillon.com
            </a>
          </div>
          <div className={styles.contactItem}>
            <p className={styles.contactLabel}>LinkedIn</p>
            <a
              href="https://www.linkedin.com/in/dillonshearer/"
              className={styles.contactValue}
              target="_blank"
              rel="noopener noreferrer"
            >
              /in/dillonshearer
            </a>
          </div>
          <div className={styles.contactItem}>
            <p className={styles.contactLabel}>GitHub</p>
            <a
              href="https://github.com/dillon-shearer"
              className={styles.contactValue}
              target="_blank"
              rel="noopener noreferrer"
            >
              /dillon-shearer
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
