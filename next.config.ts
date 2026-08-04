import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Lint runs as its own CI step (npm run lint); running it inside next build
  // triggers a Turbopack race where .next/types/validator.ts is checked before
  // it is written, failing the build on Windows.
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: '/koreader-remote',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
}

export default nextConfig
