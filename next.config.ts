import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Serve the self-contained Global Genes chatbot page (a static file in public/)
  // at the clean path /gg-chatbot.
  async rewrites() {
    return [
      { source: '/gg-chatbot', destination: '/gg-chatbot.html' },
    ]
  },
  async headers() {
    return [
      {
        source: '/koreader-remote',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        // Hidden utility page: keep it out of search (matches the koreader-remote pattern).
        source: '/gg-chatbot',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/gg-chatbot.html',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
}

export default nextConfig
