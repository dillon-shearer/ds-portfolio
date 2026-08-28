import { NextResponse } from 'next/server'
import { getGymLifts } from '@/app/demos/gym/actions'
import { enrich } from '@/lib/gym/metrics'
import { checkRateLimit } from '@/lib/rate-limit'

const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip') ?? 'unknown'
}

// very small CSV helper
const csvEscape = (v: unknown) => {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const day = searchParams.get('day') // NEW: single day
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const exclude = (searchParams.get('exclude') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const ip = getClientIp(req)
  const rateLimit = await checkRateLimit('gym-data', ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
  if (!rateLimit.allowed) {
    return new NextResponse('Too many requests', { status: 429 })
  }

  let rows = enrich(await getGymLifts())
  if (day) {
    rows = rows.filter((r) => r.date === day)
  } else {
    if (from) rows = rows.filter((r) => r.date >= from)
    if (to) rows = rows.filter((r) => r.date <= to)
  }

  const baseHeaders = rows[0]
    ? Object.keys(rows[0])
    : [
        'id',
        'date',
        'exercise',
        'weight',
        'reps',
        'setNumber',
        'timestamp',
        'dayTag',
        'isUnilateral',
        'equipment',
        'volume',
        'oneRM_est',
        'day_of_week',
        'iso_week',
        'month',
        'year',
      ]

  const headers = baseHeaders.filter((h) => !exclude.includes(h))

  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => csvEscape((r as any)[h])).join(',')),
  ]
  const csv = lines.join('\n')

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${day ? `gym-lifts-${day}` : 'gym-lifts'}.csv"`,
      'cache-control': 'no-store',
    },
  })
}
