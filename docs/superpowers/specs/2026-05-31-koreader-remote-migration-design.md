# koreader-remote migration: design

**Date:** 2026-05-31
**Status:** spec, awaiting approval
**Author:** Dillon (brainstormed with Claude)

## Summary

Port the `koreader-remote` feature from the old portfolio (`dillon-shearer-website`, Tailwind) to the new portfolio (`ds-portfolio`, Next.js 15 + CSS Modules + tokens), preserving the URL `/koreader-remote` for users who already have it bookmarked. The page is reskinned to fit the new site's design system (paper/oxblood tokens, no shadows, radii ≤ 2px) in a full-bleed dark variant suited to bedside use. The page is hidden from crawlers and unlinked from every public surface (nav, footer, dashboards list, RSS), but reachable to anyone with the URL. No password gate.

## Context & motivation

- The old version is a touch-driven KOReader page-turn remote that talks directly from the browser to the user's KOReader HTTP Inspector over LAN. Pure client-side, no env vars, no API routes, no auth.
- It lives at `/koreader-remote` on the old site and is opened from a phone on the home Wi-Fi while reading. Real users (the author) already have the URL and expect it to keep working after the portfolio migration.
- The old design (full-bleed black with sky-blue glowing pill buttons) does not fit the new site's design language. The migration is the opportunity to restyle without breaking the URL or behavior.

## Constraints & non-goals

**Constraints:**

- URL stays `/koreader-remote` at the top level.
- `localStorage` keys preserved verbatim (`dwd:koreader:endpoint`, `dwd:koreader:intro:v1`) so devices already configured against the old site keep working.
- Must obey `.claude/STYLE.md`: no `box-shadow`, no gradients, no `border-radius > 2px`, paper/oxblood/positive/warn tokens, serif headings, no em/en dashes.
- Must not appear in Header / MobileDrawer / Footer / `/dashboards` / RSS.
- No new env vars. No new API routes. No password gate.

**Non-goals:**

- Not building a "KOReader integration" feature; this is a one-page utility, not a dashboard.
- Not solving the HTTPS-page → HTTP-LAN mixed-content question. The migration inherits the same client code as the old version; if the old version works on the author's phone, the new one will. If the old version is also broken, that is a separate investigation.
- Not adding a "Refresh" action button. Prev / Next only, matching the old version's primary affordance.
- Not adding any sitemap or robots.txt entry. (No `app/sitemap.ts` exists today; this spec deliberately does not add one.)

## Architecture

### File plan

**New files:**

```
app/
  koreader-remote/
    page.tsx                    # server component; metadata.robots noindex + viewport userScalable:false
    RemotePanel.tsx             # client orchestrator: queue, connection probes, status state
    RemotePanel.module.css
    SwipeShell.tsx              # touch root; dispatches `koreader-swipe` CustomEvent
    SwipeShell.module.css
    RemoteButton.tsx            # big Prev/Next tap-target primitive
    RemoteButton.module.css
    StatusBar.tsx               # tone-aware single-line status
    StatusBar.module.css
    SetupModal.tsx              # endpoint configuration overlay
    SetupModal.module.css
    hooks/
      use-koreader-endpoint.ts
      use-screen-wake-lock.ts

lib/
  koreader/
    client.ts                   # KOREADER_ACTIONS, sendKoreaderCommand, warmKoreaderEndpoint,
                                # prefetchKoreaderConnection, normalizeEndpoint, FetchTimeoutError

components/
  SiteChrome.tsx                # client wrapper; conditionally renders Header/Footer by pathname
```

**Modified files:**

```
app/layout.tsx                  # replace inline Header/main/Footer with <SiteChrome>{children}</SiteChrome>
next.config.ts                  # add headers() entry: X-Robots-Tag: noindex, nofollow on /koreader-remote
package.json                    # add nosleep.js (^0.12.0)
```

**Files NOT touched (verified during implementation):**

- `components/Header.tsx` `NAV_ITEMS`
- `components/MobileDrawer.tsx` `NAV_ITEMS`
- `components/Footer.tsx`
- `app/dashboards/page.tsx` (dashboards listing)
- `app/rss/route.ts` (RSS feed)

### Why a `SiteChrome` wrapper instead of a route group

The root `app/layout.tsx` renders `<Header />`, `<main>{children}</main>`, `<Footer />` unconditionally. A route group's own `layout.tsx` is a child of the root layout, not a replacement, so wrapping the route in `app/(naked)/koreader-remote/` cannot suppress chrome rendered by the root. The minimal fix is a thin client component (`SiteChrome`) that checks `usePathname` and renders either the chromed or naked tree. Future hidden routes append to its `NAKED_PATHS` list.

```tsx
// components/SiteChrome.tsx
'use client';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

const NAKED_PATHS = ['/koreader-remote'];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const naked = NAKED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (naked) return <>{children}</>;
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

### Dependencies

| Dep | Version | Why |
|---|---|---|
| `nosleep.js` | ^0.12.0 | Screen-wake-lock fallback for browsers without the Wake Lock API (notably older iOS). Lazy-loaded via `await import('nosleep.js')` inside the hook so it does not ship to other pages. |

### Env vars & secrets

None. The feature is entirely client-side and talks to a user-supplied LAN endpoint stored in `localStorage`.

## Components & APIs

### `lib/koreader/client.ts`

Ported 1:1 from `dillon-shearer-website/lib/koreader/client.ts`. Public surface:

```ts
export const KOREADER_ACTIONS = {
  prev:    '/koreader/event/GotoViewRel/-1',
  next:    '/koreader/event/GotoViewRel/1',
  refresh: '/koreader/event/RefreshView',
} as const;
export type KOReaderAction = keyof typeof KOREADER_ACTIONS;

export class FetchTimeoutError extends Error {}

export function normalizeEndpoint(input: string): string;
export function buildKoreaderUrl(endpoint: string, action: KOReaderAction): string;
export function sendKoreaderCommand(
  endpoint: string,
  action: KOReaderAction,
  opts?: { timeoutMs?: number; retries?: number; retryDelayMs?: number },
): Promise<void>;
export function warmKoreaderEndpoint(endpoint: string): Promise<void>;
export function prefetchKoreaderConnection(endpoint: string): void;
```

Defaults match the old version: 1500ms timeout, 1 retry, 120ms gap, `mode: 'no-cors'`, `keepalive: true`.

### `hooks/use-koreader-endpoint.ts`

```ts
function useKoreaderEndpoint(): {
  endpoint: string;
  inputValue: string;
  setInputValue: (v: string) => void;
  savedAt: string | null;
  isReady: boolean;
  hasEndpoint: boolean;
  saveEndpoint: (raw: string) =>
    | { ok: true; value: string }
    | { ok: false; error: string };
  clearEndpoint: () => void;
};
```

localStorage key: `dwd:koreader:endpoint`. SSR-safe (guards `typeof window`). `saveEndpoint` validates non-empty and calls `normalizeEndpoint` before write.

### `hooks/use-screen-wake-lock.ts`

```ts
function useScreenWakeLock(): {
  isSupported: boolean;
  isActive: boolean;
  usingFallback: boolean;
  requiresUserInteraction: boolean;
  request: () => Promise<void>;
  release: () => void;
};
```

Prefers `navigator.wakeLock.request('screen')`. Falls back to `nosleep.js` lazy-loaded on first `request()` call. Re-acquires on `visibilitychange` when the document becomes visible again. Releases on unmount.

### `SwipeShell.tsx`

```ts
function SwipeShell({ children }: { children: React.ReactNode }): JSX.Element;
```

Viewport-filling div with `touchstart` / `touchend` listeners. On a >40px horizontal swipe inside the corresponding viewport half, dispatches `new CustomEvent('koreader-swipe', { detail: 'prev' | 'next' })` on `window`. CSS sets `touch-action: pan-y` so vertical scroll still works.

### `RemoteButton.tsx`

```ts
type Props = {
  action: KOReaderAction;
  label: string;        // "Prev" / "Next"
  hint?: string;        // small caption, e.g. "swipe ←"
  pressed?: boolean;    // momentary visual feedback owned by parent
  disabled?: boolean;
  onPress: () => void;
};
```

Renders a `<button>` that fills its grid cell. No internal state: `pressed` and `disabled` are driven by the parent so the queue processor can flash the button.

### `StatusBar.tsx`

```ts
type Tone = 'idle' | 'pending' | 'success' | 'error';
type Props = { tone: Tone; message: string; detail?: string };
```

Thin hairline-bordered single-line row. Tone maps to the leading-glyph color (`▸` idle, `◌` pending, `✓` success, `!` error) and an optional left-edge accent strip. `message` is primary; `detail` is muted.

### `SetupModal.tsx`

```ts
type Props = {
  open: boolean;
  onClose: () => void;
  endpoint: ReturnType<typeof useKoreaderEndpoint>;
};
```

Renders nothing when `open` is false. When open: viewport-filling scrim + centered card with the endpoint input, Save CTA, and a close affordance. Intro copy is shown only when `localStorage['dwd:koreader:intro:v1']` is unset; saving (or closing after first view) sets it.

### `RemotePanel.tsx` (orchestrator)

State owned:

- `useKoreaderEndpoint()` and `useScreenWakeLock()` hook results.
- `status: { tone, message, detail }`.
- `activeAction: KOReaderAction | null`. Drives the button pressed visual.
- `isPanelOpen: boolean`. Modal visibility.
- `isConnected: boolean`. Set true after first successful warmup.
- Refs: `queueRef` (array of `KOReaderAction`), `processingRef`, `probeIntervalRef`.

Effects:

1. On mount and when `endpoint` changes: if `hasEndpoint`, run `warmKoreaderEndpoint(endpoint)`. On success set `isConnected = true` and status idle. On failure start probe polling.
2. On mount: `window.addEventListener('koreader-swipe', handleSwipe)`. Pushes the action onto the queue.
3. Queue processor: when queue non-empty and not processing, take head → `setActiveAction(head)` → `sendKoreaderCommand` → update status → schedule `prefetchKoreaderConnection` → clear `activeAction` → `setTimeout(150)` → next.

Render tree:

```
<div className={styles.root}>
  <header className={styles.header}>
    <h1>KOReader Remote</h1>
    <button onClick={() => setIsPanelOpen(true)}><GearIcon /></button>
  </header>
  <SwipeShell>
    <div className={styles.grid}>
      <RemoteButton action="prev" label="Prev" hint="swipe ←" pressed={activeAction === 'prev'} ... />
      <RemoteButton action="next" label="Next" hint="swipe →" pressed={activeAction === 'next'} ... />
    </div>
  </SwipeShell>
  <StatusBar tone={status.tone} message={status.message} detail={status.detail} />
  <SetupModal open={isPanelOpen} onClose={() => setIsPanelOpen(false)} endpoint={endpointHook} />
</div>
```

### `app/koreader-remote/page.tsx`

```tsx
import type { Metadata, Viewport } from 'next';
import RemotePanel from './RemotePanel';

export const metadata: Metadata = {
  title: 'KOReader Remote',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Page() {
  return <RemotePanel />;
}
```

`userScalable: false` prevents accidental double-tap zoom while using the remote.

## Visual design

### Palette (full-bleed dark variant of the existing tokens)

| Surface | Token / expression |
|---|---|
| Page background | `var(--color-ink)` |
| Primary text / button label | `var(--color-paper)` |
| Muted text / button hint | `color-mix(in srgb, var(--color-paper) 55%, transparent)` |
| Hairline borders | `color-mix(in srgb, var(--color-paper) 22%, transparent)` |
| Pressed action / Save CTA | `var(--color-accent)` |
| Status, success | `var(--color-positive)` |
| Status, pending | `var(--color-warn)` |
| Status, error | `var(--color-accent)` |

No new tokens are added to `styles/tokens.css`. The dark-direction surface colors are expressed locally via `color-mix` in the component CSS modules to avoid polluting site-wide tokens for a single-page utility.

### Typography

| Surface | Family | Size |
|---|---|---|
| Page title | `var(--font-serif)` | `var(--text-xl)` |
| Button label | `var(--font-serif)` | `var(--text-3xl)` |
| Button hint | `var(--font-mono)` | `var(--text-xs)` |
| Status line | `var(--font-sans)` | `var(--text-sm)` |
| Setup modal input | `var(--font-mono)` | `var(--text-base)` |

Sentence case throughout. No uppercase letter-spaced microcopy (the old site's signature is not this site's).

### Layout

Mobile-first, `dvh`-based, full-bleed. On desktop the button grid is capped at `max-width: 720px` and centered horizontally so the buttons stay readable as tap targets rather than stretching across a 24" monitor. The header rule and status rule still span the full width.

```
┌────────────────────────────────────────────┐
│ KOReader Remote                       [⚙]  │  header row, padding --space-4
│ ──────────────────────────────────────────  │  1px hairline, full width
│ ┌───────────────────┐  ┌───────────────────┐│
│ │                   │  │                   ││
│ │       Prev        │  │       Next        ││  2-col grid, gap --space-4
│ │       ←           │  │           →       ││  flex: 1 fills vertical space
│ │                   │  │                   ││  1px hairline border
│ └───────────────────┘  └───────────────────┘│  radius 2px, no shadow
│ ──────────────────────────────────────────  │  1px hairline
│ ▸ Ready · 192.168.1.67:8080                │  status, padding --space-3
└────────────────────────────────────────────┘
```

### Button states

- **Default:** transparent background, 1px hairline border in muted paper, label in `--color-paper`.
- **Pressed:** background fills with `--color-accent`, label remains `--color-paper`, border-color matches background. 120ms transition in, 200ms ease-out back to default.
- **Disabled:** label and border drop to ~12% alpha. Tap-target size unchanged.
- **Focus-visible:** 2px outline in `--color-paper`, 2px offset.

### Status tones

```
▸ Ready · 192.168.1.67:8080            (idle)    glyph + text in --color-paper
◌ Sending Next…                        (pending) glyph in --color-warn,    text in --color-paper
✓ Sent Next                            (success) glyph in --color-positive, text in --color-paper
! Endpoint timed out, check Wi-Fi      (error)   glyph in --color-accent,  text in --color-paper
```

(Note: the design above renders text without em or en dashes per `.claude/STYLE.md`; status copy in implementation uses a regular hyphen or no separator.)

### Setup modal

Scrim: `color-mix(in srgb, var(--color-ink) 92%, transparent)` covering the full viewport. Card: `var(--color-ink)` background, 1px paper@22% border, radius 2px, `min(420px, calc(100dvw - 32px))` wide, padding `var(--space-6)`. Mono input rendered as a bottom-underline only (no full border box). Save button uses `--color-accent` background with `--color-paper` text. Close affordance is a text-only `[x]` in the top-right corner.

### Things consciously dropped from the old design

- Pill buttons (`rounded-[36px]`) → 2px-radius rectangles.
- Inset glow shadow on press (`shadow-[inset_0_0_30px_rgba(56,189,248,0.35)]`) → flat oxblood fill, no shadow.
- Uppercase letter-spaced microcopy → sentence case.
- Sky / emerald palette → ink / paper / oxblood / positive.

## Data flow

1. Page mount → server `page.tsx` renders `<RemotePanel />` (client).
2. `RemotePanel` mounts → `useKoreaderEndpoint` hydrates from localStorage; `isReady` flips true.
3. If `hasEndpoint`: `warmKoreaderEndpoint(endpoint)` runs 3 probes at 250ms intervals (1000ms timeout each). First success → `isConnected = true`, status idle. All fail → 3-second polling, status pending.
4. If no endpoint: `SetupModal` opens automatically; status reads "Configure endpoint to start".
5. Tap on `RemoteButton` → parent pushes action onto `queueRef`; queue processor effect runs.
6. Queue processor (single in-flight): `setActiveAction(head)` → `sendKoreaderCommand` → on success update status to success tone and schedule `prefetchKoreaderConnection` 125-175ms later; on failure update status to error tone and re-enter probe loop after 500ms. Clear `activeAction` and `setTimeout(150)` before processing the next action.
7. Swipe path: `SwipeShell` dispatches `CustomEvent('koreader-swipe', { detail: 'prev' | 'next' })` on window; `RemotePanel`'s window-level listener pushes onto the same queue. Taps and swipes share one code path.
8. Endpoint change via `SetupModal`: `saveEndpoint(raw)` validates non-empty, normalizes (prepends `http://` if no protocol), writes to localStorage, updates state, triggers the warmup effect.
9. Wake lock: first user `pointerdown` triggers `useScreenWakeLock().request()`. Releases on unmount or visibility-hidden; re-acquires when visibility returns.

## Error handling

| Condition | UX |
|---|---|
| Empty endpoint | `SetupModal` opens automatically; no error tone surfaced |
| `FetchTimeoutError` on send | Status `error`: "Endpoint timed out, check Wi-Fi" |
| Generic fetch failure on send | Status `error`: "Send failed, endpoint unreachable" |
| Warmup probes failing during cold start | Silent; status stays `pending` |
| Wake Lock API unsupported | Silent; `usingFallback` stays false |
| Wake Lock fallback needs a gesture | Append "Tap anywhere to keep screen awake" to idle detail |
| Mixed-content block (HTTPS → HTTP LAN) | Manifests as a generic fetch failure surfaced as the row above. Known inherited risk, not introduced by the migration. |

## Hide-from-crawlers implementation

1. Per-route metadata in `app/koreader-remote/page.tsx` exports `metadata.robots = { index: false, follow: false }` (renders `<meta name="robots" content="noindex, nofollow">`).
2. `next.config.ts` adds (or extends) `headers()`:
   ```ts
   async headers() {
     return [{
       source: '/koreader-remote',
       headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
     }];
   }
   ```
3. No `app/robots.ts` is added. Listing the route in robots.txt would advertise it; skipping it leaves no public-readable file that names the URL.
4. Link audit during implementation: confirm `components/Header.tsx`, `components/MobileDrawer.tsx`, `components/Footer.tsx`, `app/dashboards/page.tsx`, `app/rss/route.ts` do not reference `/koreader-remote`. No `app/sitemap.ts` exists today, so nothing to add there.
5. Post-implementation grep: `rg -n 'koreader-remote' app components` should return only files inside `app/koreader-remote/`, `components/SiteChrome.tsx`, and `next.config.ts`.

## Verification

CLAUDE.md is explicit: there is no test framework. `npm run build` is the type-checker; everything else is manual.

1. `npm run build` passes. Type errors, missing imports, and server/client boundary slips are caught here.
2. `npm run dev` smoke test:
   - `/`, `/about`, `/dashboards`, `/contact` still render with Header and Footer (regression check on `SiteChrome`).
   - `/koreader-remote` renders full-bleed dark with no Header and no Footer.
   - View source shows `<meta name="robots" content="noindex, nofollow">`.
   - DevTools Network shows response header `X-Robots-Tag: noindex, nofollow` on the `/koreader-remote` document.
   - With no endpoint: SetupModal opens automatically; invalid input shows inline error; valid input saves, normalizes, closes the modal, and transitions status to "Connecting…".
   - With a valid endpoint: status flips to "Ready · {endpoint}". Tap Prev → button flashes oxblood, status reads "Sent Prev". Tap Next → same. Swipe via DevTools touch emulation triggers the same code path.
3. Crawler sanity: `curl -I http://localhost:3000/koreader-remote | grep -i robots` shows the header. `curl http://localhost:3000/koreader-remote | grep 'name="robots"'` shows the meta.
4. Link-leak audit: the `rg` command above returns only the expected files.
5. **Merge gate (real-device test):** deploy to Vercel preview, open on phone over cellular while the KOReader is on the home Wi-Fi, configure the endpoint, tap a button. Confirms the mixed-content path actually works end-to-end. This is the only test that proves the feature; without it the migration is unverified.

## Known risks

- **Mixed content (HTTPS page → HTTP LAN endpoint).** Inherited from the old version. The new version uses the same `fetch(..., { mode: 'no-cors' })` client, so behavior is identical to today. If today's behavior is broken on the author's phone, this spec does not fix it. Mitigation would be a separate spec (service worker, HTTP-served subdomain for the remote, or a server-side proxy with caveats).
- **`color-mix` browser support.** Baseline since 2023; safe for modern phones, but the page will degrade on very old browsers. Acceptable for a one-user utility.
- **`nosleep.js` adds an `<audio>` element.** Necessary on iOS Safari where the Wake Lock API is not always available. Lazy-loaded, no impact on other pages.

## Out-of-scope / future

- No "Refresh" action button. If wanted later, the client already exports `KOREADER_ACTIONS.refresh`; adding a third button is straightforward.
- No analytics or telemetry. Adding usage logging would require an API route and is out of scope.
- No alternate themes. The dark-on-ink palette is the only visual mode.
- No password gate. If sensitive features are added later, the gym dashboard's `PasswordGate` pattern can be reused.
- `SiteChrome.NAKED_PATHS` is the future extension point for any other hidden full-bleed routes; no new infrastructure required.
