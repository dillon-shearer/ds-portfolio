import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
import { ContactForm } from './ContactForm'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Dillon Shearer for data engineering, analytics, or healthcare data projects.',
}

function EmailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1.5" y="3.5" width="15" height="11" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.5 3.5L9 9.5L16.5 3.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1.5" y="1.5" width="15" height="15" stroke="currentColor" strokeWidth="1.25" />
      <line x1="5" y1="7.5" x2="5" y2="13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="5" cy="5.5" r="0.75" fill="currentColor" />
      <line x1="8.5" y1="7.5" x2="8.5" y2="13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M8.5 10C8.5 8.5 9.5 7.5 11 7.5C12.5 7.5 13 8.5 13 10V13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 98 96" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" />
    </svg>
  )
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
        <div className={styles.contactGrid}>
          <div className={styles.contactItem}>
            <p className={styles.contactLabel}>Email</p>
            <a href="mailto:dillon@datawithdillon.com" className={styles.contactIconLink} aria-label="Send email">
              <EmailIcon />
            </a>
          </div>
          <div className={styles.contactItem}>
            <p className={styles.contactLabel}>LinkedIn</p>
            <a
              href="https://www.linkedin.com/in/dillonshearer/"
              className={styles.contactIconLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
            >
              <LinkedInIcon />
            </a>
          </div>
          <div className={styles.contactItem}>
            <p className={styles.contactLabel}>GitHub</p>
            <a
              href="https://github.com/dillon-shearer"
              className={styles.contactIconLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
            >
              <GitHubIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
