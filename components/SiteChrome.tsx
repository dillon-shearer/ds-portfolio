// components/SiteChrome.tsx
'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'

const NAKED_PATHS = ['/koreader-remote']

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const naked = NAKED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
  if (naked) {
    return <>{children}</>
  }
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
