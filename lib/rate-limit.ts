import { sql } from '@/lib/gym-db'

export type RateLimitResult = {
  allowed: boolean
  remaining: number
}

export async function checkRateLimit(
  bucket: string,
  ip: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  try {
    const { rows } = await sql /* sql */ `
      WITH updated AS (
        INSERT INTO rate_limits (key, window_start, count)
        VALUES (${`${bucket}:${ip}`}, NOW(), 1)
        ON CONFLICT (key) DO UPDATE SET
          count = CASE
            WHEN rate_limits.window_start < NOW() - (${windowMs} * INTERVAL '1 millisecond') THEN 1
            ELSE rate_limits.count + 1
          END,
          window_start = CASE
            WHEN rate_limits.window_start < NOW() - (${windowMs} * INTERVAL '1 millisecond') THEN NOW()
            ELSE rate_limits.window_start
          END
        RETURNING count
      ),
      cleaned AS (
        DELETE FROM rate_limits
        WHERE (SELECT count FROM updated) = 1
          AND window_start < NOW() - INTERVAL '1 day'
      )
      SELECT count FROM updated
    `
    const count = rows[0]?.count
    if (typeof count !== 'number') throw new Error('Rate limit query returned no count')

    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0),
    }
  } catch (error) {
    console.error('Rate limit check failed, allowing request:', error)
    return { allowed: true, remaining: -1 }
  }
}
