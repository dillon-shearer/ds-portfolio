// components/SiteChrome.tsx
'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'

// /links is a public link-in-bio page: no Header or Footer, but still indexable.
const NAKED_PATHS: string[] = ['/links']

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const naked = NAKED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
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
