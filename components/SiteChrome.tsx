// components/SiteChrome.tsx
'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'
import styles from './SiteChrome.module.css'

const NAKED_PATHS: string[] = []

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const naked = NAKED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (naked) {
    return <>{children}</>
  }
  return (
    <>
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <Footer />
    </>
  )
}
