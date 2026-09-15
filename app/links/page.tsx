import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
import { LINK_HUB, HUB_PLATFORMS } from '@/content/links'
import { sql } from '@/lib/gym-db'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: LINK_HUB.metadataTitle,
  description: LINK_HUB.metadataDescription,
}

// The list is data-driven from Neon, so a freshness window keeps a newly added or
// renamed channel from waiting on a redeploy. One hour matches the other data pages.
export const revalidate = 3600

type HubChannel = {
  channelName: string
  displayName: string
  youtubeUrl: string | null
  instagramUrl: string | null
}

type HubRow = {
  channel_name: string
  display_name: string | null
  youtube_url: string | null
  instagram_url: string | null
}

async function loadChannels(): Promise<HubChannel[]> {
  try {
    const { rows } = await sql /* sql */ `
      SELECT channel_name, display_name, youtube_url, instagram_url
      FROM pipeline_channel_stats
      WHERE youtube_url IS NOT NULL OR instagram_url IS NOT NULL
      ORDER BY COALESCE(display_name, channel_name)
    `
    return (rows as HubRow[]).map((row) => ({
      channelName: row.channel_name,
      displayName: row.display_name ?? row.channel_name,
      youtubeUrl: row.youtube_url,
      instagramUrl: row.instagram_url,
    }))
  } catch {
    // An unreachable database must not take the page down. The hub shows its empty
    // state rather than an error a visitor cannot act on.
    return []
  }
}

// The three currently-live channels, for the development-only UI evidence harness.
// Production ignores this and always reads the table.
const SAMPLE: HubChannel[] = [
  'daily.writing.prompts0',
  'reddit.daily.story.time0',
  'reddit.tifu.stories0',
].map((name) => ({
  channelName: name,
  displayName: name,
  youtubeUrl: `https://www.youtube.com/@${name}`,
  instagramUrl: `https://www.instagram.com/${name}`,
}))

async function resolveChannels(searchParams: Promise<{ __uiState?: string }>) {
  if (process.env.NODE_ENV !== 'production') {
    const { __uiState } = await searchParams
    if (__uiState === 'sample') return SAMPLE
    if (__uiState === 'empty') return []
  }
  return loadChannels()
}

function destination(url: string) {
  return url.replace(/^https?:\/\//, '')
}

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ __uiState?: string }>
}) {
  const channels = await resolveChannels(searchParams)

  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow={LINK_HUB.eyebrow}
        title={LINK_HUB.title}
        lead={LINK_HUB.lead}
        rule={false}
      />
      {channels.length === 0 ? (
        <p className={styles.empty}>{LINK_HUB.empty}</p>
      ) : (
        <ul className={styles.list} aria-label="Channels">
          {channels.map((channel) => (
            <li key={channel.channelName} className={styles.channel}>
              <h2 className={styles.channelName}>{channel.displayName}</h2>
              <ul className={styles.links} aria-label={channel.displayName}>
                {HUB_PLATFORMS.map(({ key, label }) => {
                  const url = key === 'youtube' ? channel.youtubeUrl : channel.instagramUrl
                  if (!url) return null
                  return (
                    <li key={key}>
                      <a
                        className={styles.tapTarget}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className={styles.platform}>{label}</span>
                        <span className={styles.dest}>{destination(url)}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
