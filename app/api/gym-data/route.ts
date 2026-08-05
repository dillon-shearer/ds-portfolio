import { NextResponse } from 'next/server'
import { getGymLifts } from '@/app/dashboards/gym/actions'
import { enrich, type OutRow } from '@/lib/gym/metrics'

const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip') ?? 'unknown'
}

function checkRateLimit(ip: string) {
  const now = Date.now()
  const bucket = rateBuckets.get(ip)
  if (bucket && bucket.resetAt > now) {
    if (bucket.count >= RATE_LIMIT_MAX) return false
    bucket.count += 1
    rateBuckets.set(ip, bucket)
    return true
  }
  rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
  return true
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const day = searchParams.get('day')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
  const limitParam = parseInt(searchParams.get('limit') || '200', 10)
  const limit = Math.min(Math.max(limitParam || 200, 1), 500)
  const exclude = (searchParams.get('exclude') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const ip = getClientIp(req)
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let rows = enrich(await getGymLifts())

  if (day) {
    rows = rows.filter((r) => r.date === day)
  } else {
    if (from) rows = rows.filter((r) => r.date >= from)
    if (to) rows = rows.filter((r) => r.date <= to)
  }

  if (exclude.length && rows.length) {
    rows = rows.map((r) => {
      const copy: any = { ...r }
      for (const key of exclude) delete copy[key as keyof OutRow]
      return copy
    })
  }

  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit
  const pagedRows = rows.slice(start, start + limit)

  return new NextResponse(
    JSON.stringify(
      {
        meta: {
          count: pagedRows.length,
          total_count: total,
          page,
          total_pages: totalPages,
          generated_at: new Date().toISOString(),
          fields: Object.keys(pagedRows[0] ?? {}),
          filter: day ? { day } : { from, to },
          note: 'Wide export with raw + derived fields (includes dayTag, isUnilateral, equipment; excludes bodyParts).',
        },
        data: pagedRows,
      },
      null,
      2,
    ),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="${day ? `gym-lifts-${day}` : 'gym-lifts'}.json"`,
        'cache-control': 'private, max-age=0, must-revalidate',
        'x-ratelimit-limit': RATE_LIMIT_MAX.toString(),
        'x-ratelimit-remaining': Math.max(
          RATE_LIMIT_MAX - (rateBuckets.get(ip)?.count ?? 0),
          0,
        ).toString(),
      },
    },
  )
}
