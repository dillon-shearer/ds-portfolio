// Copy for the mobile link hub at /links (P5-T414), a self-hosted link-in-bio page.
// The channel rows themselves are data-driven from the pipeline_channel_stats table
// the pipeline pushes to, so a new channel appears here with no edit to this file.

export const LINK_HUB = {
  route: '/links',
  metadataTitle: 'Channel links',
  metadataDescription:
    'Every channel my Reddit-to-video pipeline runs, linked to its YouTube and Instagram profile.',
  eyebrow: 'Links',
  title: 'My channels',
  lead: 'Each channel my pipeline posts to, with a tap through to it on YouTube and Instagram.',
  empty: 'Channel links are not available right now. Check back shortly.',
} as const

/** Platforms the hub links, in render order. No TikTok (P5-T414). */
export const HUB_PLATFORMS = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'instagram', label: 'Instagram' },
] as const
