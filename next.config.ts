import type { NextConfig } from 'next'

const vercelCommitSha = process.env.VERCEL_GIT_COMMIT_SHA
const buildSha = vercelCommitSha?.slice(0, 7).toLowerCase()
const buildDate = new Date().toISOString().slice(0, 10)

const nextConfig: NextConfig = {
  // Lint runs as its own CI step (npm run lint); running it inside next build
  // triggers a Turbopack race where .next/types/validator.ts is checked before
  // it is written, failing the build on Windows.
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_BUILD_DATE: buildDate,
    ...(buildSha ? { NEXT_PUBLIC_BUILD_SHA: buildSha } : {}),
  },
  // /dashboards was the public prefix until P5-T62 and is still indexed and
  // printed on the resume, so the old URLs redirect permanently.
  async redirects() {
    return [
      { source: '/dashboards', destination: '/demos', permanent: true },
      { source: '/dashboards/gym', destination: '/demos/gym', permanent: true },
      {
        source: '/dashboards/coming-soon',
        destination: '/demos/coming-soon',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
