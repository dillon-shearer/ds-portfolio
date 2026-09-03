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

**Superseded 2026-09-02 by section 6 (P5-T66).** The reasoning below still
holds for why a hand-refreshed snapshot was rejected; the conclusion that the
page carries no numbers at all no longer does.

**Original decision: no data. The page is static content plus artwork.**

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

## 6. Per-channel stats: source and refresh (P5-T66, 2026-09-02)

**Decision: a small table in the existing Neon Postgres, written on a timer by
the tiktok-script dashboard process that is already running, read server-side by
this page.**

Section 5 rejected numbers because the only proposal on the table was a snapshot
the owner hand-edits into `content/`, and that rots silently. The objection was
to the hand-editing, not to the numbers. This section keeps the numbers and
removes the hand-editing.

### Why this source

`pipeline.db` stays where it is. Nothing on Vercel reads it, and the tailnet Hono
dashboard stays tailnet-only. The pipeline machine pushes out, the website never
reaches in.

Two alternatives were weighed and rejected:

- A scheduled job that commits a JSON snapshot into this repo. It works, but it
  makes a background process author commits on `main` and triggers a Vercel
  deploy every refresh, which collides with the owner's own working tree and
  fills the history with machine noise.
- Public platform APIs. The YouTube Data API reports channel stats, but TikTok
  and Instagram do not expose comparable public numbers, so two thirds of every
  card would be blank or would need a different metric than the third.

The Neon route needs no new infrastructure on either side. The portfolio already
connects to that database (`DATABASE_URL`, pooled through `lib/gym-db.ts`) for
the gym dashboard, and tiktok-script's `src/services/dashboard/server.ts` already
runs five `setInterval` ticks in a long-lived process (reconcile, retention,
storage snapshot, backup, final-artifact recovery). The push is a sixth tick in
an established pattern.

### The three metrics

Plain counts and one date. No charts, no derived rates, no per-video rows.

| Label | Value |
|---|---|
| `Posted` | videos posted all time |
| `Last 30d` | videos posted in the trailing 30 days |
| `Latest` | date of the most recent post |

All three come from `pipeline_items` in `pipeline.db`, counting rows with a
non-null `posted_at` grouped by `channel_name`. Counting items rather than
`platform_posts` rows means one video posted to three platforms counts once,
which is what "videos posted" reads as. `platform_posts.platform_url` is still
NULL for TikTok, so nothing here depends on it.

`Last 30d` is the metric that carries the weight: it is the one a visitor reads
as "is this thing actually still running". The all-time count is context for it,
and `Latest` is the check on both.

### Typed shape in `content/reddit-pipeline.ts`

```ts
export type ChannelStats = {
  /** videos with a posted_at, all time */
  posted: number
  /** videos posted in the trailing 30 days */
  postedLast30Days: number
  /** ISO date of the most recent post, null if the channel has never posted */
  latestPostedAt: string | null
  /** when the pipeline wrote this row; the card's freshness label reads it */
  capturedAt: string
}

export type PipelineChannel = {
  // ...existing fields unchanged...
  /**
   * Live counts, attached server-side in page.tsx from Neon. Absent when the
   * query fails or the channel has no row yet; the card then renders as it
   * does today, with no stats block.
   */
  stats?: ChannelStats
}
```

`stats` is never written into the `REDDIT_PIPELINE` literal. The literal stays
hand-authored static content; `page.tsx` reads the table, matches rows to
channels on `key` (which already equals `channel_name` in `pipeline.db`), and
merges. That keeps the "no hand-refreshed readings in `content/`" rule from
section 5 intact.

### What changes on the tiktok-script side

1. **Table.** One table in the existing Neon database, created by a committed
   one-shot migration in this repo under `db/migrations/`, following the
   convention in the root `CLAUDE.md`:

   ```sql
   CREATE TABLE pipeline_channel_stats (
     channel_name        text PRIMARY KEY,
     posted              integer NOT NULL,
     posted_last_30_days integer NOT NULL,
     latest_posted_at    date,
     captured_at         timestamptz NOT NULL DEFAULT now()
   );
   ```

   Three rows, upserted in place. It never grows.

2. **Tick.** A `publicStatsTick` in tiktok-script alongside the existing ticks in
   `src/services/dashboard/server.ts`, on a six hour interval. It runs the
   grouped count against `pipeline.db`, upserts one row per channel, and logs and
   swallows failures the way the sibling ticks do. A failed push is not an
   outage: the page keeps serving the last row and its freshness label ages.

3. **Credential.** A write connection string for that database in tiktok-script's
   `.env`, plus a Postgres client dependency (it has none today). Grant it insert
   and update on this one table only. Do not reuse the gym chat read-only role,
   and do not hand the pipeline the pooled `DATABASE_URL` the website uses.

4. **Nothing else.** No change to the schema in `src/db/schema.ts`, no change to
   any queue, job, or posting path.

### Staleness and how the card says so

Worst case is the tick interval plus the page's revalidate window: six hours plus
one hour, so under eight hours in normal operation. That bound only holds while
the pipeline machine is up, which is exactly why the card does not state a bound.

The card renders a fourth line under the three stats, in the same small mono
treatment as the profile links: `Updated 3h ago`, computed at render time from
`capturedAt`. It is a relative age, not a fixed claim. If the machine is off for
a week the label reads `Updated 6d ago` and the visitor knows to discount the
numbers, which is precisely what the hand-refreshed snapshot could not do.

Because that line is computed per request, the page needs `export const
revalidate = 3600` (matching `app/demos/page.tsx`) rather than full static
generation, or the label freezes at build time.

### Placement on the card

Between the subreddit line and the profile links, inside `.itemBody` in
`ChannelCarousel.tsx`. Three label/value pairs on one row at 720px and up,
stacked at 390px, with the freshness line beneath. Same type scale and color as
`.profileLink`, so the block reads as card metadata and not as a dashboard KPI
row. No borders, per `.claude/STYLE.md`.

### Not shipped in P5-T66

This ticket is the decision only. The card snippet needs the Neon table, the tick,
and the credential to exist first, all of them on the tiktok-script side, so the
implementation is a follow-up for the owner to file. Until then the page renders
exactly as P5-T63 shipped it.

## Out of scope

Per-video analytics, the compilations feature, and any change to the Shmoney
repo. Live fetching of `pipeline.db` or the tailnet Hono dashboard from Vercel
stays out of scope; section 6 pushes from the pipeline instead of pulling.
