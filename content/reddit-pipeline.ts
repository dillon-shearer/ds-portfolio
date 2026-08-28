export type PipelinePlatform = 'tiktok' | 'instagram' | 'youtube'

/**
 * The handle is identical on all three platforms and equals the channel name,
 * so a profile URL is a prefix plus the handle. Nothing is stored per platform.
 */
export const PROFILE_BASE: Record<PipelinePlatform, string> = {
  tiktok: 'https://www.tiktok.com/@',
  instagram: 'https://www.instagram.com/',
  youtube: 'https://www.youtube.com/@',
}

export const PROFILE_PLATFORMS: PipelinePlatform[] = ['tiktok', 'instagram', 'youtube']

export function profileUrl(platform: PipelinePlatform, handle: string) {
  return PROFILE_BASE[platform] + handle
}

export type PipelineChannel = {
  /** channel_name in pipeline.db, kept so the channel can be matched back */
  key: string
  name: string
  subreddit: string
  /** same on TikTok, Instagram, and YouTube; the three URLs derive from it */
  handle: string
  banner: { src: string; alt: string }
  logo: {
    src: string
    /** empty on purpose: the logo repeats the channel name it sits beside */
    alt: string
  }
}

export type RedditPipelineOverview = {
  route: string
  metadataTitle: string
  metadataDescription: string
  eyebrow: string
  title: string
  lead: string
  description: string
  carouselLabel: string
  carouselAriaLabel: string
  channels: PipelineChannel[]
}

/** Rendered size of the shipped assets in public/channels, in CSS pixels. */
export const BANNER_SIZE = { width: 1200, height: 675 }
export const LOGO_SIZE = { width: 256, height: 256 }

export const REDDIT_PIPELINE: RedditPipelineOverview = {
  route: '/demos/reddit-pipeline',
  metadataTitle: 'Reddit to short-form video pipeline',
  metadataDescription:
    'The channels my Reddit to short-form video pipeline posts to on TikTok, Instagram, and YouTube.',
  eyebrow: 'Demos',
  title: 'Reddit to short-form video pipeline',
  lead: 'A local pipeline that turns Reddit stories into narrated, captioned short-form videos and posts them on a schedule.',
  description:
    'Stories come out of subreddit RSS feeds, get narrated with Kokoro TTS, captioned with faster-whisper, composited over background video, and pushed to TikTok, YouTube, and Instagram through each platform connection. Every stage runs as a BullMQ job. These are the channels it currently runs.',
  carouselLabel: 'Channels',
  carouselAriaLabel: 'Pipeline channels',
  channels: [
    {
      key: 'reddit.daily.story.time0',
      name: 'Daily Story Time',
      subreddit: 'r/AmItheAsshole',
      handle: 'reddit.daily.story.time0',
      banner: {
        src: '/channels/aita/banner.png',
        alt: 'Reddit AITA Daily channel banner: the channel name in white and orange on a black field flanked by orange chevrons.',
      },
      logo: { src: '/channels/aita/logo.png', alt: '' },
    },
    {
      key: 'reddit.tifu.stories0',
      name: 'TIFU Stories',
      subreddit: 'r/TIFU',
      handle: 'reddit.tifu.stories0',
      banner: {
        src: '/channels/tifu/banner.png',
        alt: 'Reddit TIFU Daily channel banner: the channel name in white and orange on a black field flanked by orange chevrons.',
      },
      logo: { src: '/channels/tifu/logo.png', alt: '' },
    },
    {
      key: 'daily.writing.prompts0',
      name: 'Daily Writing Prompts',
      subreddit: 'r/WritingPrompts',
      handle: 'daily.writing.prompts0',
      banner: {
        src: '/channels/wp/banner.png',
        alt: 'Reddit WP Daily channel banner: the channel name in white and orange on a black field flanked by orange chevrons.',
      },
      logo: { src: '/channels/wp/logo.png', alt: '' },
    },
  ],
}
