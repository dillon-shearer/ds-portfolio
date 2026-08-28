# Reddit pipeline overview page

Design spec for P5-T61. Written 2026-08-28. Nothing here is built yet: this
document plus the card 3 href are the whole deliverable. It builds against
`docs/design-spec.md` and `.claude/STYLE.md`; where those two disagree with
this file, they win.

## 1. Route and page structure

### Route

The page is one segment under the demos list page: `/demos/reddit-pipeline`.
The route moves with the list, exactly like `/demos/gym` does.

It is deliberately not a `/work/...` case study. `/work/gym-tracker` is the
long-form pattern with a stat grid and numbered sections; this is a short
overview whose only job is to show the channels, so it belongs under the list
it is reached from.

Entry point: the card 03 title on the list page, via the `href` now set in
`content/dashboards.ts`. The page is a normal indexed route, not a hidden one:
no `robots` metadata, no `next.config.ts` header, no `NAKED_PATHS` entry.

### Structure

`page-wrapper--wide` (matching the list page and home), three blocks top to
bottom, left aligned:

1. `PageHeader` with `eyebrow`, `title`, `lead`, and `rule={false}` (the same
   call shape the list page uses). Copy lives in `content/reddit-pipeline.ts`.
2. One description paragraph: sans, `--text-md`, `--color-ink-2`, measure
   capped at 68ch. It says what the pipeline does and that the channels below
   are the ones it currently runs.
3. The carousel section: a mono uppercase xs section label, the prev/next
   control row, the scroller, and a mono xs snapshot line reading
   `COUNTS AS OF 2026-08-28`.

A 1px `--color-rule` hairline sits between block 2 and block 3, full width of
the content column. That is the only rule on the page.

### Visual brief

- **Hierarchy:** the h1 first, then the channel names inside the carousel
  items, then the counts, then the three profile links. Everything else
  recedes to `--color-ink-3` at `--text-xs`.
- **Surfaces:** two levels only. Page is `--color-paper`; each carousel item is
  `--color-rule-soft`, the dashboard panel surface, with `--space-5` padding
  and no border. The panel-darker-than-page inversion is intentional and
  documented in the spec.
- **Density:** `--space-4` between carousel items (the dashboard panel gap),
  `--space-7` between page blocks.
- **Deliberately absent:** no pagination dots, no autoplay, no infinite loop,
  no drag-to-scroll, no per-video thumbnails, no platform icons or logos, no
  carousel library. Three channels do not earn any of it.

## 2. Carousel item anatomy

One `<li>` per channel, in the order the content module lists them. Inside,
top to bottom:

| Element | Type | Style |
|---|---|---|
| Channel display name | `h3` | display font, 600, `--text-lg`, `--color-ink` |
| Subreddit | `p` | mono, `--text-xs`, uppercase, `--tracking-wide`, `--color-ink-3` |
| Videos posted | `p` | number in display font at `--text-2xl`, label `VIDEOS POSTED` in mono xs uppercase beneath it |
| Profile links | `ul` of three | mono, `--text-xs`, uppercase, `--color-accent`, 1px underline, `--color-accent-hover` on hover; labels `TIKTOK`, `INSTAGRAM`, `YOUTUBE`, separated by ` / ` |
| Latest video link | `a` | sans `--text-sm`, 1px underline, accent on hover; text `Watch the latest on YouTube`, platform taken from the data |

All five outbound links are `target="_blank" rel="noopener noreferrer"`, the
same treatment `DashboardCard` already gives an external `href`.

Empty state: when a channel has no `latestVideo`, the link is omitted
entirely. No placeholder text, no disabled link, no `N/A`. TikTok posts are
made by browser automation and never record a `platform_url`, so the latest
video link is always a YouTube or Instagram URL, never a TikTok one. The three
profile links are always present.

Longest plausible strings to design against: `Daily Writing Prompts` as the
name, `R/AMITHEASSHOLE` as the subreddit, and a three-digit count. The item
does not truncate; it wraps.

## 3. Responsive and keyboard

### Layout

The scroller is a flex row with `overflow-x: auto`,
`scroll-snap-type: x mandatory`, and `gap: var(--space-4)`. Each item gets
`scroll-snap-align: start`. Item width by breakpoint, using only the two
breakpoints the system has:

- Below 720px: `flex: 0 0 100%`, one item per screen. Works at 320px because
  the item is fluid and its content wraps.
- 720px to 1079px: `flex: 0 0 calc(50% - var(--space-4) / 2)`, two visible.
- 1080px and up: `flex: 0 0 calc((100% - var(--space-4) * 2) / 3)`, three
  visible. With today's three channels nothing overflows at this width, so the
  carousel reads as a plain row and the controls disable themselves. That is
  the intended end state, not a bug; a fourth channel starts it scrolling
  again.

The scroller carries `padding: 2px` so a focused child's 2px accent outline at
2px offset is not clipped by `overflow-x: auto`.

### Controls

A row above the scroller, aligned right: two real `<button type="button">`
elements reusing the gym dashboard `.navArrow` treatment
(`background: var(--color-rule-soft)`, no border, 2px radius max), labelled
`aria-label="Previous channel"` and `aria-label="Next channel"`. Each calls
`scrollBy` on the scroller by one item width. Each is `disabled` when the
scroller is at that end, which covers the 1080px case where nothing scrolls.
They exist for mouse users on desktop, where a wheel does not scroll
horizontally without a modifier, and they are the only JavaScript on the page.

### Keyboard and focus

- Tab order is DOM order: prev, next, then each item's TikTok, Instagram,
  YouTube, and latest video links, item by item. No focus trap, no roving
  tabindex, no arrow-key handler.
- The scroller needs no `tabindex="0"`. Every item contains focusable links, so
  the scrollable-region-focusable requirement is already met by its content;
  adding a tabindex would only insert a dead stop in the order.
- Focusing a link in an offscreen item scrolls it into view natively. No
  scripted focus management.
- Focus ring is the site standard: 2px `--color-accent` outline at 2px offset,
  visible on every link and both buttons.
- `scroll-behavior: smooth` on the scroller is already neutralised by the
  global `prefers-reduced-motion` block in `app/globals.css`, which forces
  `scroll-behavior: auto`. Do not add a second reduced-motion rule for it.
- Heading order: `h1` from `PageHeader`, `h2` on the carousel section label,
  `h3` on each channel name.

## 4. Content shape

New module `content/reddit-pipeline.ts`, following the existing content
modules. Nothing imports it until the page ticket.

```ts
export type PipelinePlatform = 'tiktok' | 'instagram' | 'youtube'

export type PipelineChannel = {
  /** channel_name in pipeline.db, kept so a refresh can be matched back */
  key: string
  name: string
  subreddit: string
  profiles: Record<PipelinePlatform, string>
  videosPosted: number
  latestVideo?: { platform: PipelinePlatform; href: string }
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
  /** ISO date the counts were read out of pipeline.db */
  snapshotDate: string
  channels: PipelineChannel[]
}

export const REDDIT_PIPELINE: RedditPipelineOverview = {
  route: '/demos/reddit-pipeline',
  metadataTitle: 'Reddit to short-form video pipeline',
  metadataDescription:
    'The channels my Reddit to short-form video pipeline posts to, with post counts and the most recent video on each.',
  eyebrow: 'Demos',
  title: 'Reddit to short-form video pipeline',
  lead: 'A local pipeline that turns Reddit stories into narrated, captioned short-form videos and posts them on a schedule.',
  description:
    'Stories come out of subreddit RSS feeds, get narrated with Kokoro TTS, captioned with faster-whisper, composited over background video, and pushed to TikTok, YouTube, and Instagram through each platform connection. Every stage runs as a BullMQ job. These are the channels it currently runs.',
  carouselLabel: 'Channels',
  carouselAriaLabel: 'Pipeline channels',
  snapshotDate: '2026-08-28',
  channels: [
    {
      key: 'reddit.daily.story.time0',
      name: 'Daily Story Time',
      subreddit: 'r/AmItheAsshole',
      profiles: {
        tiktok: 'https://www.tiktok.com/@reddit.daily.story.time0',
        instagram: 'https://www.instagram.com/reddit.daily.story.time0',
        youtube: 'https://www.youtube.com/@reddit.daily.story.time0',
      },
      videosPosted: 18,
      latestVideo: { platform: 'youtube', href: 'https://youtu.be/zBLYOB6b6JA' },
    },
    {
      key: 'reddit.tifu.stories0',
      name: 'TIFU Stories',
      subreddit: 'r/TIFU',
      profiles: {
        tiktok: 'https://www.tiktok.com/@reddit.tifu.stories0',
        instagram: 'https://www.instagram.com/reddit.tifu.stories0',
        youtube: 'https://www.youtube.com/@reddit.tifu.stories0',
      },
      videosPosted: 2,
      latestVideo: { platform: 'youtube', href: 'https://youtu.be/H1hI1asEEuY' },
    },
    {
      key: 'daily.writing.prompts0',
      name: 'Daily Writing Prompts',
      subreddit: 'r/WritingPrompts',
      profiles: {
        tiktok: 'https://www.tiktok.com/@daily.writing.prompts0',
        instagram: 'https://www.instagram.com/daily.writing.prompts0',
        youtube: 'https://www.youtube.com/@daily.writing.prompts0',
      },
      videosPosted: 1,
    },
  ],
}
```

Two things in that block need the owner before the page ships:

1. **Profile URLs.** Only `daily.writing.prompts0` has `channels.profile_urls`
   set in the database; the other two rows are NULL. The URLs above for those
   two channels are derived from the handle pattern the third channel uses
   (handle equals channel name) and are unverified. Confirm each one resolves,
   or fill `channels.profile_urls` in pipeline.db and re-read it.
2. **`videosPosted`.** The 2026-08-28 snapshot recorded per-platform posted
   counts of youtube 18, instagram 18, tiktok 17 for the first channel, 2 each
   for the second, and 1 each for the third. The values above are the
   distinct-video reading of "videos posted", which for that snapshot equals
   the highest per-platform count. Confirm with the refresh query below.

Copy in this module follows the site voice rules: plain and specific, no
appositive-count phrasing, no buzzwords, ASCII only.

## 5. Data source decision

**Decision: a static snapshot in `content/reddit-pipeline.ts`, refreshed by
hand.**

`pipeline.db` is a local SQLite file at
`C:/Users/dills/tiktok-script/data/pipeline.db`, read through better-sqlite3 by
a Hono server that is only reachable on the tailnet. The portfolio deploys to
Vercel, so at request time it has a path to neither. A snapshot is also the
pattern every other module in `content/` already follows, and these numbers
move a few times a week at most, on a page that is an overview rather than
analytics.

The cost is that the counts go stale between refreshes. The page pays for that
honestly by rendering `snapshotDate` as `COUNTS AS OF 2026-08-28` under the
carousel, so it never claims to be live.

Upgrade path, out of scope here: the pipeline commits or uploads a small public
JSON export and the page reads it at build time with the existing `revalidate`
pattern. Nothing in the shape above blocks that; `snapshotDate` just starts
coming from the export.

Refresh procedure, run against pipeline.db in the Shmoney repo:

```sql
-- videosPosted per channel
SELECT i.channel_name,
       COUNT(DISTINCT p.item_id) AS videos_posted,
       MAX(p.posted_at)          AS last_posted_at
FROM platform_posts p
JOIN pipeline_items i ON i.id = p.item_id
WHERE p.status = 'posted'
GROUP BY i.channel_name;

-- latestVideo per channel
SELECT i.channel_name, p.platform, p.platform_url, p.posted_at
FROM platform_posts p
JOIN pipeline_items i ON i.id = p.item_id
WHERE p.status = 'posted' AND p.platform_url IS NOT NULL
ORDER BY p.posted_at DESC;

-- profile links and subreddits
SELECT name, default_subreddit, profile_urls FROM channels;
```

`platform_posts.platform_url` is NULL for every TikTok row because those posts
go out through browser automation, so the second query only ever returns
YouTube and Instagram URLs.

## Out of scope

Building the page, live data fetching, per-video analytics, the compilations
feature, and any change to the Shmoney repo.
