import { ImageResponse } from 'next/og'
import { CONTACT_PAGE } from '@/content/contact'
import { SITE } from '@/content/site'

export const alt = `${CONTACT_PAGE.title} | ${SITE.title}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        background: '#FAFAF8',
        boxSizing: 'border-box',
        color: '#111110',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '56px 64px',
        width: '100%',
      }}
    >
      <div
        style={{
          color: '#6F6B64',
          fontFamily: 'monospace',
          fontSize: 22,
          letterSpacing: '0.08em',
        }}
      >
        {SITE.title.toUpperCase()}
      </div>
      <div
        style={{
          color: '#6F6B64',
          fontFamily: 'monospace',
          fontSize: 20,
          letterSpacing: '0.08em',
          marginTop: 94,
        }}
      >
        {CONTACT_PAGE.eyebrow}
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: 'sans-serif',
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginTop: 16,
        }}
      >
        {CONTACT_PAGE.title}
      </div>
      <div
        style={{
          background: '#7A2E2E',
          height: 4,
          marginTop: 36,
          width: 176,
        }}
      />
      <div
        style={{
          color: '#6F6B64',
          fontFamily: 'monospace',
          fontSize: 20,
          marginTop: 'auto',
        }}
      >
        {SITE.url.replace(/^https?:\/\//, '')}
      </div>
    </div>,
    size,
  )
}
