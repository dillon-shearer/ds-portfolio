import Link from 'next/link'
import { NAV_ITEMS, SOCIALS } from '@/content/site'
import styles from './Footer.module.css'

export function Footer() {
  const year = new Date().getFullYear()
  const buildSha = process.env.NEXT_PUBLIC_BUILD_SHA
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.columns}>
          <div>
            <p className={styles.columnTitle}>NAVIGATE</p>
            <ul className={styles.columnLinks}>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.columnLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={styles.columnTitle}>ELSEWHERE</p>
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
            <p className={styles.columnTitle}>CONNECT</p>
            <ul className={styles.columnLinks}>
              <li>
                <a href={`mailto:${SOCIALS.email}`} className={styles.columnLink}>
                  {SOCIALS.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.meta}>
          <span>(c) {year} Dillon Shearer</span>
          <span aria-hidden="true">/</span>
          <a
            href={SOCIALS.sourceRepo}
            className={styles.metaLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            View source
          </a>
          <span aria-hidden="true">/</span>
          <Link href="/rss" className={styles.metaLink}>
            RSS
          </Link>
          <span aria-hidden="true">/</span>
          <span>Built with Next.js</span>
          {buildSha ? (
            <>
              <span aria-hidden="true">/</span>
              <span>{buildSha}</span>
            </>
          ) : null}
          <span aria-hidden="true">/</span>
          <span>{buildDate}</span>
        </div>
      </div>
    </footer>
  )
}
