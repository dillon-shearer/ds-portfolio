import type { Metadata } from 'next'
import { Source_Serif_4, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import '@/styles/tokens.css'
import './globals.css'

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--next-font-serif',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--next-font-sans',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  variable: '--next-font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'Data With Dillon',
    template: '%s | Data With Dillon',
  },
  description:
    'Data engineer and analyst building analytics, pipelines, and AI tooling for healthcare and life-science teams.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
