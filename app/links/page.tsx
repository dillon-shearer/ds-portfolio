import type { Metadata } from 'next'
import { LINK_HUB } from '@/content/links'
import { sql } from '@/lib/gym-db'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: LINK_HUB.metadataTitle,
  description: LINK_HUB.metadataDescription,
}

// The list is data-driven from Neon, so a new or renamed channel does not wait on a
// redeploy. One hour matches the other data pages.
export const revalidate = 3600

type HubChannel = {
  channelName: string
  displayName: string
  subreddit: string | null
  youtubeUrl: string | null
  instagramUrl: string | null
}

type HubRow = {
  channel_name: string
  display_name: string | null
  subreddit: string | null
  youtube_url: string | null
  instagram_url: string | null
}

async function loadChannels(): Promise<HubChannel[]> {
  try {
    const { rows } = await sql /* sql */ `
      SELECT channel_name, display_name, subreddit, youtube_url, instagram_url
      FROM pipeline_channel_stats
      WHERE youtube_url IS NOT NULL OR instagram_url IS NOT NULL
      ORDER BY COALESCE(display_name, channel_name)
    `
    return (rows as HubRow[]).map((row) => ({
      channelName: row.channel_name,
      displayName: row.display_name ?? row.channel_name,
      subreddit: row.subreddit,
      youtubeUrl: row.youtube_url,
      instagramUrl: row.instagram_url,
    }))
  } catch {
    // An unreachable database must not take the page down; it shows its empty state.
    return []
  }
}

// Sample rows for the development-only UI evidence harness. Production always reads Neon.
const SAMPLE: HubChannel[] = [
  ['daily.writing.prompts0', 'r/WritingPrompts'],
  ['reddit.daily.story.time0', 'r/AmItheAsshole'],
  ['reddit.tifu.stories0', 'r/TIFU'],
].map(([name, subreddit]) => ({
  channelName: name,
  displayName: name,
  subreddit,
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

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ __uiState?: string }>
}) {
  const channels = await resolveChannels(searchParams)

  return (
    <main className={styles.hub}>
      <h1 className={styles.srOnly}>{LINK_HUB.title}</h1>
      {channels.length === 0 ? (
        <p className={styles.empty}>{LINK_HUB.empty}</p>
      ) : (
        <ul className={styles.list} aria-label="Channels">
          {channels.map((channel) => (
            <li key={channel.channelName} className={styles.channel}>
              <h2 className={styles.name}>
                {channel.displayName}
                {channel.subreddit && <span className={styles.sub}>{channel.subreddit}</span>}
              </h2>
              <div className={styles.halves}>
                {channel.youtubeUrl && (
                  <a href={channel.youtubeUrl} className={styles.half}>
                    YouTube
                  </a>
                )}
                {channel.instagramUrl && (
                  <a href={channel.instagramUrl} className={styles.half}>
                    Instagram
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
