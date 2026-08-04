import Link from 'next/link'
import { FOOTER_NAV, SOCIALS } from '@/content/site'
import styles from './Footer.module.css'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.columns}>
          <div>
            <p className={styles.columnTitle}>Navigate</p>
            <ul className={styles.columnLinks}>
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.columnLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={styles.columnTitle}>Elsewhere</p>
            <ul className={styles.columnLinks}>
              <li>
                <a
                  href={SOCIALS.sourceRepo}
                  className={styles.columnLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  This site&apos;s source
                </a>
              </li>
              <li>
                <a
                  href={SOCIALS.github}
                  className={styles.columnLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={SOCIALS.linkedin}
                  className={styles.columnLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className={styles.columnTitle}>Connect</p>
            <ul className={styles.columnLinks}>
              <li>
                <a
                  href={`mailto:${SOCIALS.email}`}
                  className={styles.columnLink}
                >
                  {SOCIALS.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.meta}>
          <span>&copy; {year} Dillon Shearer</span>
          <a
            href={SOCIALS.sourceRepo}
            className={styles.columnLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            View source
          </a>
          <span>Built with Next.js</span>
        </div>
      </div>
    </footer>
  )
}
