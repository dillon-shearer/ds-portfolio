import { ImageResponse } from 'next/og'

export const alt = 'Data With Dillon'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

const statementLines = ['I do data work for', 'healthcare and', 'life science teams.']

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
        DATA WITH DILLON
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginTop: 108,
        }}
      >
        {statementLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
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
        datawithdillon.com
      </div>
    </div>,
    size,
  )
}
