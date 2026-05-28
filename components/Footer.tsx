import Link from 'next/link'
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
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
              ].map((item) => (
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
                  href="https://github.com/dillon-shearer/ds-portfolio"
                  className={styles.columnLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  This site's source
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/dillon-shearer"
                  className={styles.columnLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/dillonshearer/"
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
                  href="mailto:dillon@datawithdillon.com"
                  className={styles.columnLink}
                >
                  dillon@datawithdillon.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.meta}>
          <span>© {year} Dillon Shearer</span>
          <a
            href="https://github.com/dillon-shearer/ds-portfolio"
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
