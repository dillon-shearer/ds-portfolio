import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Schibsted_Grotesk } from 'next/font/google'
import { SiteChrome } from '@/components/SiteChrome'
import { SITE } from '@/content/site'
import '@/styles/tokens.css'
import './globals.css'

const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
  variable: '--next-font-display',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--next-font-sans',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--next-font-mono',
})

export const metadata: Metadata = {
  title: {
    default: SITE.title,
    template: `%s | ${SITE.title}`,
  },
  description: SITE.description,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${schibstedGrotesk.variable} ${inter.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
