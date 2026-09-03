import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
import {
  REDDIT_PIPELINE,
  type ChannelStats,
  type PipelineChannel,
} from '@/content/reddit-pipeline'
import { sql } from '@/lib/gym-db'
import { ChannelCarousel } from './ChannelCarousel'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: REDDIT_PIPELINE.metadataTitle,
  description: REDDIT_PIPELINE.metadataDescription,
}

// The freshness label is a relative age computed at render, so the page cannot be
// fully static. One hour matches /demos.
export const revalidate = 3600

const TIME_ZONE = 'America/New_York'

const latestFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/**
 * The pipeline posts twice a day, so the latest reading carries a time as well as
 * a date. Formatted in one fixed zone with an explicit suffix; without the zone
 * the string would shift with whichever region rendered it.
 */
function formatLatest(value: string | Date | null) {
  if (!value) return null
  return `${latestFormat.format(new Date(value))} ET`
}

/**
 * The age of the reading, not of the page. A stalled pipeline machine ages this
 * label instead of leaving a stale count looking current.
 */
function formatAge(capturedAt: string | Date) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(capturedAt).getTime()) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

// The driver may hand back timestamps as Date or as string depending on the type
// parsers in play; both formatters normalise, so neither shape can surprise the page.
type StatsRow = {
  channel_name: string
  posted: number
  posted_last_30_days: number
  latest_posted_at: string | Date | null
  captured_at: string | Date
}

async function loadStats(): Promise<Map<string, ChannelStats>> {
  const stats = new Map<string, ChannelStats>()
  try {
    const { rows } = await sql /* sql */ `
      SELECT channel_name, posted, posted_last_30_days, latest_posted_at, captured_at
      FROM pipeline_channel_stats
    `
    for (const row of rows as StatsRow[]) {
      stats.set(row.channel_name, {
        posted: row.posted,
        postedLast30Days: row.posted_last_30_days,
        latestPosted: formatLatest(row.latest_posted_at),
        captured: formatAge(row.captured_at),
      })
    }
  } catch {
    // The cards read fine without numbers. An unreachable database must not take
    // the page down, and a visible error would say nothing a visitor can act on.
  }
  return stats
}

/**
 * Development-only seam for the UI evidence harness, matching the gym scenario's
 * `__uiState`. Production ignores it and always reads the table.
 */
async function resolveStats(searchParams: Promise<{ __uiState?: string }>) {
  if (process.env.NODE_ENV !== 'production') {
    const { __uiState } = await searchParams
    if (__uiState === 'empty') return new Map<string, ChannelStats>()
  }
  return loadStats()
}

export default async function RedditPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ __uiState?: string }>
}) {
  const stats = await resolveStats(searchParams)
  const channels: PipelineChannel[] = REDDIT_PIPELINE.channels.map((channel) => {
    const found = stats.get(channel.key)
    return found ? { ...channel, stats: found } : channel
  })

  return (
    <div className="page-wrapper--wide">
      <PageHeader
        eyebrow={REDDIT_PIPELINE.eyebrow}
        title={REDDIT_PIPELINE.title}
        lead={REDDIT_PIPELINE.lead}
        rule={false}
      />
      <p className={styles.description}>{REDDIT_PIPELINE.description}</p>
      <hr className={styles.rule} />
      <section className={styles.carousel}>
        <h2 className={styles.sectionLabel}>{REDDIT_PIPELINE.carouselLabel}</h2>
        <ChannelCarousel channels={channels} ariaLabel={REDDIT_PIPELINE.carouselAriaLabel} />
      </section>
    </div>
  )
}
