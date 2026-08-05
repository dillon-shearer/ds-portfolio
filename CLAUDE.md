# Data With Dillon - Portfolio

Next.js 15 App Router / TypeScript / CSS Modules / Vercel

## Commands

```bash
npm run dev        # dev server at http://localhost:3000
npm run lint       # ESLint
npm run check:ascii # enforce ASCII-only tracked text files
npx tsc --noEmit   # TypeScript type check
```

CI lives in `.github/workflows/ci.yml` and runs `npm run check:ascii`, `npm run lint`,
and `npm run build` with dummy environment values on pushes and pull requests.

## Environment

Copy `.env.example` to `.env.local` and replace the placeholders. It documents the
public URL, contact form, gym database, gym chat, and local fallback variables.

## Key files

- `.claude/STYLE.md`   - design system rules (read before any UI work)
- `.claude/AGENTS.md`  - agent-specific rules and gotchas (read before any task)
- `styles/tokens.css`  - all design tokens (colors, spacing, type scale)
- `components/ui/`     - UI primitives (no new ones without updating .claude/STYLE.md)
- `components/dashboard/` - dashboard framework primitives (see .claude/STYLE.md)

## Architecture

```
app/             Next.js App Router pages
components/ui/   Shared UI primitives (Badge, Button, InlineLink, NavLink, Card, Input, PageHeader, DashboardCard)
components/      Layout components (Header, Footer, MobileDrawer)
content/         Structured site, home, about, dashboard, RSS, and contact content
docs/            Locked design spec and feature-parity reference
scripts/         Repository checks including check-ascii.mjs
styles/          tokens.css only - all other styles are CSS Modules co-located with components
.claude/         Agent guidance (STYLE.md, AGENTS.md, HANDOFF.md)
```

## Routes

| Path | Purpose |
|---|---|
| `/` | Home |
| `/about` | Bio, resumes, certifications |
| `/contact` | Contact form (Resend API) |
| `/dashboards` | Dashboard list |
| `/dashboards/coming-soon` | Placeholder for unhosted dashboards |
| `/dashboards/gym` | Gym tracker dashboard (analytics, log workout, AI chat) |
| `/koreader-remote` | Hidden full-bleed dark utility (KOReader page-turn remote). Not linked anywhere; reachable to anyone with the URL. See the hidden-route pattern in Gotchas. |
| `/rss` | RSS feed |

## Gotchas

- **Nav and copy changes:** edit `NAV_ITEMS` in `content/site.ts`; Header, MobileDrawer, and Footer all consume it. All marketing copy, nav, socials, and structured entries live in `content/` (site, home, about, dashboards, rss, contact). Update data files instead of JSX for copy changes.
- **Hidden-route pattern:** noindex via per-route `export const metadata = { robots: { index: false, follow: false } }` PLUS an `X-Robots-Tag: noindex, nofollow` entry in `next.config.ts` `headers()`. Deliberately NO `app/robots.ts` entry - listing the path there would advertise it. Add the route to `NAKED_PATHS` in `components/SiteChrome.tsx` to suppress Header and Footer for full-bleed pages. Do not add the route to nav, footer, dashboards list, or RSS.
- **Root `app/layout.tsx` does NOT render `<Header />` or `<Footer />` directly** - they live inside `components/SiteChrome.tsx`, which conditionally renders them based on pathname (`NAKED_PATHS` array). Don't move them back into the root layout; that re-introduces the chrome on `/koreader-remote` and any future naked routes.
- **CSS precedence:** page-level CSS modules load before the root bundle in Next.js 15 - page-level overrides silently lose to component rules. Use component props or inline styles instead. See `.claude/STYLE.md`.
- No `border-radius` > 2px, no `box-shadow`, no gradients - see `.claude/STYLE.md`
- No em dashes or en dashes anywhere in copy
- **R3F Canvas height:** `height: 100%` on a Canvas requires the parent to have explicit `height:`, not just `min-height:` - with only `min-height` the canvas renders at 0px
- **R3F rotation:** never use both a `useFrame` spin group AND `OrbitControls autoRotate` - they conflict and visually cancel; use only OrbitControls
- **R3F Environment (drei):** loads HDRI from CDN and can cause WebGL context instability; use directional lights only for simple scenes
- **R3F setClearColor:** takes a hardcoded hex string, not a CSS variable. It must equal `--color-rule-soft` (currently `#F1EFEA`). If that token changes, update `NA_COLOR` and `gl.setClearColor` in `app/dashboards/gym/panels/BodyDiagram.tsx`; an unmatched canvas background creates a visible inner-panel border.
- **Dashboard panels:** no borders; background `--color-rule-soft`; `--space-4` gap between all panels. `--color-rule-soft` (`#F1EFEA`) is the darker panel color, while `--color-paper` (`#FAFAF8`) is the lighter page background. This inversion is intentional. Do not swap them.
- **Dashboard control buttons:** inactive time range buttons, Download, inactive tab, Back button (`.navBtn`), and nav arrows (`.navArrow`) all use `background: var(--color-rule-soft)` - same as panels. Do not use `background: none` or `--color-paper-2` for these.
- **DailyView panel pattern:** `DailyView/index.module.css` uses the same pattern as the main dashboard - `.root { gap: var(--space-4) }`, `.kpiItem { background: var(--color-rule-soft); padding: var(--space-5) }`, no border separators. If you touch the day view, verify these are intact.
- **Footer margin-top:** set to `--space-5` (24px) - don't increase it; the old `--space-9` (96px) was intentionally reduced
- **Chart tooltips:** all custom Recharts tooltip components use dark style - `background: var(--color-ink)`, `color: var(--color-paper)`, `padding: var(--space-2) var(--space-3)`, no border. Matches BodyDiagram's CSS-module tooltip. Do not use the light paper/border style.
- **Gym download API:** `/api/gym-data` and `/api/gym-data.csv` are auth-free - the download modal sends no token. Do not add auth to these endpoints; it breaks the download button silently.
- **Gym chat - follow-up ideas removed:** The "Follow-up ideas" button row was intentionally removed from `FloatingChatWidget.tsx` and the system prompt rule that generated them was removed from `route.ts`. Do not add them back.
- **Gym chat - body_part values injected at startup:** `loadBodyParts()` in `lib/gym-chat/catalog.ts` queries `SELECT key, label FROM body_parts` and caches the result. `getBodyPartsContext()` formats it for the system prompt as `## Available Body Part Values` (e.g. `quads (Quads), hamstrings (Hamstrings), ...`). Called alongside `loadGymCatalog()` in `route.ts`. This prevents the model from guessing body_part filter values that don't exist.
- **Gym chat SQL policy - `= ANY()` and `<> ALL()` are broken:** `pgsql-ast-parser` in `lib/gym-chat/sql-policy.ts` mangles `= ANY($1::text[])` into `= "any"($1::text[])` and `p <> ALL(arr)` into `p != "all"(arr)` (both invalid - Postgres errors with `function any/all(...) does not exist`). Never use array params with `= ANY()` or `<> ALL()`. For ANY: use individual `ILIKE` params with OR: `(exercise ILIKE $1 OR exercise ILIKE $2 OR exercise ILIKE $3)`. For ALL: use `NOT EXISTS (SELECT 1 FROM unnest(arr) AS x WHERE x = p)` instead.
- **Gym chat - `gym_lifts_v` is the muscle-aware view:** Created in `db/migrations/2026-05-31-gym-data-unification.sql`. Pre-resolves `canonical_name` and `body_part_key` via `exercises` + `exercise_aliases`. All muscle-aware SQL patterns query the view; raw `gym_lifts` is for anatomy-irrelevant queries only. `gym_day_meta.body_parts` is session INTENT (planned), distinct from `gym_lifts_v.body_part_key` (actually logged) - both are useful for different questions.
- **FloatingChatWidget panel height:** `.panel` uses `height: min(560px, calc(100dvh - 100px))` - explicit `height` (not `max-height`) is required for `.messagesOuter` (`flex: 1`) to expand. The 100px reserves space for the trigger button (44px) + gap (12px) + bottom offset (24px) + buffer below the panel; `80dvh` alone can push the input row off the bottom of the viewport.
- **FloatingChatWidget - ReactMarkdown wraps message content in `<p class="mdP">` with built-in `margin-bottom`:** plain user/assistant text rendered through `<MarkdownContent>` inherits `.mdP { margin: 0 0 var(--space-2) }`, producing visibly asymmetric padding inside `.messageUser`/`.messageAssistant` bubbles. The override `.message > :last-child.mdP { margin-bottom: 0 }` (specificity 0,3,0) beats `.mdP` (0,1,0) and trims the trailing margin. Same applies to `.mdUl`/`.mdOl`.
- **Turbopack CSS Module HMR is stale-prone:** new CSS rules (especially `position: absolute`, new classes, new selectors) often don't apply after edits even though TSX hot-reloads. Symptom: new elements appear in the DOM with default browser styling (e.g. an absolutely-positioned button rendering at top-left of its container instead of where CSS says). Fix: full `npm run dev` restart. `npm run build` is not affected.
- **Gym dashboard mobile:** responsive breakpoints are 720px and 1080px. Follow the current rules in `docs/design-spec.md` and `.claude/STYLE.md` when changing responsive layout.
- **Design docs:** current design and parity references live directly in `docs/`, especially `docs/design-spec.md` and `docs/feature-parity.md`.

## DB migrations

No migration framework. Commit one-shot SQL in `db/migrations/YYYY-MM-DD-name.sql` and use a throwaway runner that loads `.env.local` and selects `DATABASE_URL_UNPOOLED` when owner access is needed. `db/migrations/2026-05-31-gym-data-unification.sql` is the current reference. Use `GYM_CHAT_DATABASE_URL_READONLY` (the `gym_chat_ro` role) when verifying grants. Delete the runner after use; only the SQL file gets committed.

## Gym Chat

- **System prompt:** `buildSystemPrompt()` in `app/api/gym-chat/route.ts`; model + temperature config in `lib/gym-chat/llm.ts` (`resolveModel()` - currently gpt-4o, temp 0.2 for main chat, temp 0 for chart spec generation)
- **SQL context files:** `lib/gym-chat/semantics.ts` (query patterns), `lib/gym-chat/capabilities.ts` (metric definitions), `lib/gym-chat/catalog.ts` (live schema + table annotations loaded from DB)
- **`session_date` and `performed_at` are CTE aliases, not real columns in `gym_lifts`** - queries that filter or group by date must use the shared sets CTE; using these names directly against `gym_lifts` produces "column does not exist" errors. The system prompt rule must say "always use" not "prefer" for the CTE.
- **Error enrichment:** `interpretSqlError()` in `lib/gym-chat/sql-errors.ts` is wired into `buildToolResultPayload` in `llm.ts`; `buildSqlErrorAssistantMessage` in the same file is unused dead code.
- **Module-level const ordering:** in `catalog.ts`, `TABLE_ANNOTATIONS` must be declared before `let cachedContext = buildCatalogContext(FALLBACK_TABLES)` - function declarations hoist but `const` does not; placing a `const` after a module-init call that reads it causes Turbopack "cannot access before initialization" at build time.
