import type { ChannelVideo } from '@/lib/videos'

export const CHANNEL = {
  id: 'UCVhC-pY8Oljs9dfb3wcmpHA',
  url: 'https://www.youtube.com/@DataWithDillon',
  subscribeUrl: 'https://www.youtube.com/@DataWithDillon?sub_confirmation=1',
  feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCVhC-pY8Oljs9dfb3wcmpHA',
}

export const VIDEOS_PAGE = {
  title: 'Videos',
  lead: 'Videos from my YouTube channel, newest first.',
  subscribeLabel: 'Subscribe on YouTube',
  empty: 'No videos yet.',
  metadata: {
    title: 'Videos',
    description:
      'Videos by Dillon Shearer, a data scientist and data engineer, from the Data With Dillon YouTube channel: recorded build sessions with AI agents and data tools.',
  },
} as const

export const HOME_VIDEO_STRIP = {
  heading: 'Latest video',
  allLabel: 'All videos',
  allHref: '/videos',
}

export const FALLBACK_VIDEOS: ChannelVideo[] = [
  {
    id: 'Lr1pzc2-U8g',
    title: '[Rainy Day Vibe Coding] Building a Brand Skill with AI Agents',
    published: '2026-11-04',
    duration: '1:23:52',
    description:
      'Rain, lofi, no talking. AI agents working through a ticket board to create a custom branded skill package.',
  },
]
