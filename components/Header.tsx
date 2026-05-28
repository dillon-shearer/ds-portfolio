'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavLink } from '@/components/ui'
import { MobileDrawer } from './MobileDrawer'
import styles from './Header.module.css'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.wordmark} aria-label="Data With Dillon, home">
            Data With Dillon
          </Link>

          <nav className={styles.desktopNav} aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} currentPath={pathname}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            className={styles.hamburger}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentPath={pathname}
      />
    </>
  )
}
