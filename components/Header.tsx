'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavLink } from '@/components/ui'
import { NAV_ITEMS } from '@/content/site'
import { MobileDrawer } from './MobileDrawer'
import styles from './Header.module.css'

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const restoreMenuFocusRef = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!drawerOpen && restoreMenuFocusRef.current) {
      menuButtonRef.current?.focus()
      restoreMenuFocusRef.current = false
    }
  }, [drawerOpen])

  function closeDrawer() {
    restoreMenuFocusRef.current = true
    setDrawerOpen(false)
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.wordmark} aria-label="Data With Dillon, home">
            DATA WITH DILLON
          </Link>

          <nav className={styles.desktopNav} aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} currentPath={pathname}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            ref={menuButtonRef}
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
        onClose={closeDrawer}
        currentPath={pathname}
      />
    </>
  )
}
