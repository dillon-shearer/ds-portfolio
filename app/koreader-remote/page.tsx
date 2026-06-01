// app/koreader-remote/page.tsx
import type { Metadata, Viewport } from 'next'
import { RemotePanel } from './RemotePanel'

export const metadata: Metadata = {
  title: 'KOReader Remote',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function Page() {
  return <RemotePanel />
}
