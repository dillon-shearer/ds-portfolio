# Reddit pipeline overview page

Design spec for P5-T61, amended in P5-T63 to describe the page as built.
Written 2026-08-28. It builds against `docs/design-spec.md` and
`.claude/STYLE.md`; where those two disagree with this file, they win.

The page holds no data that can go stale: no counts, no most-recent-video
link, no snapshot date. The three profile links per channel are the whole
route to current output.

## 1. Route and page structure

### Route

The page is one segment under the demos list page: `/demos/reddit-pipeline`.
The route moves with the list, exactly like `/demos/gym` does.

It is deliberately not a `/work/...` case study. `/work/gym-tracker` is the
long-form pattern with a stat grid and numbered sections; this is a short
overview whose only job is to show the channels, so it belongs under the list
it is reached from.

Entry point: the card 03 title on the list page, via the `href` in
`content/dashboards.ts`. The page is a normal indexed route, not a hidden one:
no `robots` metadata, no `next.config.ts` header, no `NAKED_PATHS` entry.

Files: `app/demos/reddit-pipeline/page.tsx` (server component, metadata and
page structure), `app/demos/reddit-pipeline/ChannelCarousel.tsx` (the client
component holding the two buttons and the scroller), and
`app/demos/reddit-pipeline/page.module.css`.

### Structure

`page-wrapper--wide` (matching the list page and home), three blocks top to
bottom, left aligned:

1. `PageHeader` with `eyebrow`, `title`, `lead`, and `rule={false}` (the same
   call shape the list page uses). Copy lives in `content/reddit-pipeline.ts`.
2. One description paragraph: sans, `--text-md`, `--color-ink-2`, measure
   capped at 68ch. It says what the pipeline does and that the channels below
   are the ones it currently runs.
3. The carousel section: a mono uppercase xs section label, the prev/next
   control row, and the scroller.

A 1px `--color-rule` hairline sits between block 2 and block 3, full width of
the content column. That is the only rule on the page.

### Visual brief

- **Hierarchy:** the h1 first, then each card's banner artwork, then the
  channel names, then the three profile links. Everything else recedes to
  `--color-ink-3` at `--text-xs`.
- **Surfaces:** two levels only. Page is `--color-paper`; each carousel item is
  `--color-rule-soft`, the dashboard panel surface, with `--space-5` padding
  around the text and no border. The panel-darker-than-page inversion is
  intentional and documented in the spec.
- **Density:** `--space-4` between carousel items (the dashboard panel gap),
  `--space-7` between page blocks.
- **Deliberately absent:** no pagination dots, no autoplay, no infinite loop,
  no drag-to-scroll, no per-video thumbnails, no platform icons, no carousel
  library. Three channels do not earn any of it.

## 2. Carousel item anatomy

One `<li>` per channel, in the order the content module lists them. Inside,
top to bottom:

| Element | Type | Style |
|---|---|---|
| Channel banner | `next/image` | Full-bleed strip across the top of the card, `object-fit: cover` at 96px tall below 720px and 120px at 720px and up. No radius, no shadow. Real alt text from the content module |
| Channel logo | `next/image` | 48px square in a row with the channel name, `--radius-sm`. `alt=""`: it repeats the name it sits beside |
| Channel display name | `h3` | display font, 600, `--text-lg`, `--color-ink` |
| Subreddit | `p` | mono, `--text-xs`, uppercase, `--tracking-wide`, `--color-ink-3` |
| Profile links | `ul` of three | mono, `--text-xs`, uppercase, `--color-accent`, 1px underline, `--color-accent-hover` on hover; labels `TIKTOK`, `INSTAGRAM`, `YOUTUBE`, separated by ` / ` |

All three outbound links are `target="_blank" rel="noopener noreferrer"`, the
same treatment `DashboardCard` already gives an external `href`.

### Banner layout decision

The banner is a **full-bleed strip across the top of the card**, not a smaller
block beside the logo. At 320px the card is the full content column, so a
beside-the-logo block leaves both images too small to read, while a strip whose
height is capped at 96px keeps the artwork legible and still spends less than a
third of the card on picture. The card body carries the `--space-5` padding;
the `<li>` itself has none, so the strip can reach both edges without negative
margins.

Longest plausible strings to design against: `Daily Writing Prompts` as the
name and `R/AMITHEASSHOLE` as the subreddit. The item does not truncate; it
wraps.

### Assets

Six PNGs in `public/channels/<aita|tifu|wp>/<banner|logo>.png`, copied out of
the owner's channel folders and downscaled with the `sharp` already present as
a Next dependency: banners to 1200x675 with `fit: 'cover'`, which crops the
2560x1440 tifu banner to the same 16:9 as the other two, and logos to 256x256.
Palette-quantized PNG output takes the set from about 8MB to under 400KB. Both
sizes are exported from the content module as `BANNER_SIZE` and `LOGO_SIZE` and
passed to `next/image` as explicit `width` and `height`.

The source folders also contain a `users.txt` holding platform account email
addresses. It stays out of the repo.

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
`scrollBy` on the scroller by one item width plus the flex gap. Each is
`disabled` when the scroller is at that end, which covers the 1080px case where
nothing scrolls. They exist for mouse users on desktop, where a wheel does not
scroll horizontally without a modifier, and they are the only JavaScript on the
page.

### Keyboard and focus

- Tab order is DOM order: prev, next, then each item's TikTok, Instagram, and
  YouTube links, item by item. No focus trap, no roving tabindex, no arrow-key
  handler.
- The scroller needs no `tabindex="0"`. Every item contains focusable links, so
  the scrollable-region-focusable requirement is already met by its content;
  adding a tabindex would only insert a dead stop in the order.
- Focusing a link in an offscreen item scrolls it into view natively. No
  scripted focus management.
- Focus ring is the site standard: 2px `--color-accent` outline at 2px offset,
  visible on every link and both buttons. At 1080px and up both buttons are
  disabled, so a keyboard evidence pass has to start from a profile link, not
  from a button.
- `scroll-behavior: smooth` on the scroller is already neutralised by the
  global `prefers-reduced-motion` block in `app/globals.css`, which forces
  `scroll-behavior: auto`. Do not add a second reduced-motion rule for it.
- Heading order: `h1` from `PageHeader`, `h2` on the carousel section label,
  `h3` on each channel name.

## 4. Content shape

`content/reddit-pipeline.ts`, following the existing content modules.

```ts
export type PipelinePlatform = 'tiktok' | 'instagram' | 'youtube'

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
```

No profile URL is stored. The handle is identical on all three platforms and
equals the channel name, confirmed by the owner in P5-T63, so the three URLs
are built from one `handle` field. The three handles are
`reddit.daily.story.time0` (r/AmItheAsshole), `reddit.tifu.stories0` (r/TIFU),
and `daily.writing.prompts0` (r/WritingPrompts).

Copy in this module follows the site voice rules: plain and specific, no
appositive-count phrasing, no buzzwords, ASCII only.

## 5. Data source decision

**Decision: no data. The page is static content plus artwork.**

P5-T61 specced a hand-refreshed snapshot of posted-video counts and a
most-recent-video link, and the owner cut both in P5-T63. Both were readings of
`pipeline.db`, a local SQLite file at
`C:/Users/dills/tiktok-script/data/pipeline.db` read through a Hono server that
is only reachable on the tailnet, so a Vercel deploy can reach neither at
request time and the values could only ever be a snapshot that rots between
refreshes. The three profile links already lead a visitor to the latest videos,
which is what the counts were standing in for.

That removes the refresh procedure entirely. Nothing on this page needs to be
re-read out of the database, and nothing on it can be out of date except the
artwork, which changes when the owner rebrands a channel.

If live numbers are ever wanted, the upgrade path is unchanged and out of scope
here: the pipeline uploads a small public JSON export and the page reads it at
build time with the existing `revalidate` pattern.

## Out of scope

Live data fetching, per-video analytics, the compilations feature, and any
change to the Shmoney repo.
