# koreader-remote migration implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the `koreader-remote` feature from the old portfolio to this Next.js 15 + CSS Modules portfolio at the same URL (`/koreader-remote`), reskinned to the new design system as a full-bleed dark page, hidden from crawlers via per-route noindex metadata and an `X-Robots-Tag` response header, unlinked from every public navigation surface.

**Architecture:** Pure client-side feature. A new `lib/koreader/client.ts` module handles fetches to the user's LAN endpoint (no API routes, no env vars). Two hooks (`use-koreader-endpoint`, `use-screen-wake-lock`) handle localStorage and screen-wake fallbacks. Five presentational components (`RemoteButton`, `StatusBar`, `SetupModal`, `SwipeShell`, `RemotePanel`) compose the page. Site chrome is suppressed via a new `SiteChrome` client wrapper in the root layout that checks `usePathname`.

**Tech Stack:** Next.js 15.5 (App Router, Turbopack), React 19, TypeScript 5, CSS Modules, design tokens in `styles/tokens.css`. One new npm dep: `nosleep.js`.

**Reference spec:** `docs/superpowers/specs/2026-05-31-koreader-remote-migration-design.md`.

**Important environment notes:**

- This project has **no test framework**. `npm run build` is the type-checker (per `CLAUDE.md`). Each task ends with `npm run build` + a manual smoke check (for UI changes) + a commit.
- `.claude/STYLE.md` is strict: no `box-shadow`, no gradients, no `border-radius > 2px`, no em or en dashes anywhere in copy.
- Turbopack CSS Module HMR is stale-prone for new rules (per `CLAUDE.md`). If a new component's CSS does not appear during dev, a full `npm run dev` restart fixes it.

**One deliberate deviation from the old version:** the old code requires a user gesture on the status bar to begin connection probing. The spec (and this plan) make probing automatic on mount whenever `hasEndpoint` is true. If the user later prefers the gesture-required model, restoring it is a small follow-up.

---

## Task 1: Add the `nosleep.js` dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (via npm)

- [ ] **Step 1: Install the dependency**

Run from the project root:

```bash
npm install nosleep.js@^0.12.0
```

Expected: `package.json` `dependencies` gains `"nosleep.js": "^0.12.0"`, `package-lock.json` updated.

- [ ] **Step 2: Verify build still passes**

```bash
npm run build
```

Expected: build succeeds; the dep is now installed but not yet imported, so nothing in the bundle changes.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
chore(deps): add nosleep.js for koreader-remote screen wake-lock fallback

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Port `lib/koreader/client.ts`

Pure logic, no UI. Ports 1:1 from the old project with no behavior changes.

**Files:**
- Create: `lib/koreader/client.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/koreader/client.ts

export const KOREADER_STORAGE_KEY = 'dwd:koreader:endpoint'

export const KOREADER_ACTIONS = {
  next: {
    id: 'next',
    label: 'Next Page',
    path: '/koreader/event/GotoViewRel/1',
  },
  prev: {
    id: 'prev',
    label: 'Previous Page',
    path: '/koreader/event/GotoViewRel/-1',
  },
  refresh: {
    id: 'refresh',
    label: 'Refresh Display',
    path: '/koreader/event/RefreshView',
  },
} as const

export type KoreaderActionId = keyof typeof KOREADER_ACTIONS

export function normalizeEndpoint(rawEndpoint: string): string {
  const trimmed = rawEndpoint.trim()
  if (!trimmed) {
    return ''
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `http://${trimmed}`
}

export function buildKoreaderUrl(endpoint: string, actionId: KoreaderActionId): string {
  const normalizedEndpoint = normalizeEndpoint(endpoint)
  if (!normalizedEndpoint) {
    throw new Error('KOReader endpoint is not configured.')
  }
  const action = KOREADER_ACTIONS[actionId]
  if (!action) {
    throw new Error(`Unknown KOReader action: ${actionId}`)
  }
  return `${normalizedEndpoint.replace(/\/+$/, '')}${action.path}`
}

type SendCommandResult =
  | { ok: true; url: string }
  | { ok: false; url?: string; error: string }

type SendOptions = {
  retries?: number
  retryDelayMs?: number
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 1500
const DEFAULT_RETRY_DELAY_MS = 120
const DEFAULT_WARM_TIMEOUT_MS = 1000

class FetchTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out (${Math.round(timeoutMs / 1000)} seconds).`)
    this.name = 'FetchTimeoutError'
  }
}

export async function sendKoreaderCommand(
  endpoint: string | undefined,
  actionId: KoreaderActionId,
  options: SendOptions = {},
): Promise<SendCommandResult> {
  if (!endpoint?.trim()) {
    return { ok: false, error: 'KOReader endpoint is not configured.' }
  }

  let url: string
  try {
    url = buildKoreaderUrl(endpoint, actionId)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to build KOReader URL.',
    }
  }

  const attempts = (options.retries ?? 1) + 1
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const retryDelay = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
  let lastErrorMessage = 'KOReader server unreachable. Confirm IP, port, and Wi-Fi.'

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await fetchKoreaderEndpoint(url, timeoutMs)
      return { ok: true, url }
    } catch (error) {
      if (error instanceof FetchTimeoutError) {
        lastErrorMessage = error.message
      } else if (error instanceof Error) {
        lastErrorMessage = error.message
      } else {
        lastErrorMessage = 'KOReader server unreachable. Confirm IP, port, and Wi-Fi.'
      }
      if (attempt === attempts - 1) {
        return { ok: false, url, error: lastErrorMessage }
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }
  return { ok: false, error: 'Unknown KOReader error.' }
}

export type WarmResult = { ok: true } | { ok: false; error: string }

export async function warmKoreaderEndpoint(endpoint: string | undefined): Promise<WarmResult> {
  if (!endpoint?.trim()) {
    return { ok: false, error: 'KOReader endpoint not configured.' }
  }
  try {
    await fetchKoreaderEndpoint(normalizeEndpoint(endpoint), DEFAULT_WARM_TIMEOUT_MS)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to reach KOReader. Confirm the IP and port.',
    }
  }
}

export async function prefetchKoreaderConnection(endpoint: string | undefined): Promise<void> {
  if (!endpoint?.trim()) return
  try {
    await fetchKoreaderEndpoint(normalizeEndpoint(endpoint), DEFAULT_WARM_TIMEOUT_MS)
  } catch {
    // Prefetch is best-effort; ignore failures so the UI stays optimistic.
  }
}

async function fetchKoreaderEndpoint(url: string, timeoutMs: number) {
  if (!url) {
    throw new Error('KOReader endpoint is not configured.')
  }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      keepalive: true,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new FetchTimeoutError(timeoutMs)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build succeeds. The module is unused so far, but `next build` type-checks all source files.

- [ ] **Step 3: Commit**

```bash
git add lib/koreader/client.ts
git commit -m "$(cat <<'EOF'
feat(koreader): port client.ts from old portfolio

Pure-logic module: KOREADER_ACTIONS map, sendKoreaderCommand with
AbortController timeout + 1 retry, warmKoreaderEndpoint ping,
prefetchKoreaderConnection. mode: 'no-cors' for cross-origin LAN calls.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Port the `useKoreaderEndpoint` hook

**Files:**
- Create: `app/koreader-remote/hooks/use-koreader-endpoint.ts`

- [ ] **Step 1: Create the file**

```ts
// app/koreader-remote/hooks/use-koreader-endpoint.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { KOREADER_STORAGE_KEY } from '@/lib/koreader/client'

type SaveResult =
  | { ok: true; value: string }
  | { ok: false; error: string }

export function useKoreaderEndpoint() {
  const [endpoint, setEndpoint] = useState<string>('')
  const [inputValue, setInputValue] = useState<string>('')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const hasEndpoint = Boolean(endpoint.trim())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(KOREADER_STORAGE_KEY)
    if (stored) {
      setEndpoint(stored)
      setInputValue(stored)
    }
    setIsReady(true)
  }, [])

  const saveEndpoint = useCallback((): SaveResult => {
    if (typeof window === 'undefined') {
      return { ok: false, error: 'Window is not available.' }
    }
    const trimmed = inputValue.trim()
    if (!trimmed) {
      return { ok: false, error: 'Enter the KOReader IP and port before saving.' }
    }
    try {
      window.localStorage.setItem(KOREADER_STORAGE_KEY, trimmed)
      setEndpoint(trimmed)
      setSavedAt(new Date().toISOString())
      return { ok: true, value: trimmed }
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to save endpoint. Confirm localStorage is available.',
      }
    }
  }, [inputValue])

  return {
    endpoint,
    hasEndpoint,
    inputValue,
    setInputValue,
    saveEndpoint,
    savedAt,
    isReady,
  }
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/koreader-remote/hooks/use-koreader-endpoint.ts
git commit -m "$(cat <<'EOF'
feat(koreader): port useKoreaderEndpoint hook

Hydrates from localStorage key dwd:koreader:endpoint (preserved verbatim
so devices configured against the old portfolio keep working).
SSR-safe via typeof window guards.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Port the `useScreenWakeLock` hook

Static `nosleep.js` import is fine here. Next.js code-splits per route, so the dep only ships in the `/koreader-remote` chunk because nothing else imports this hook.

**Files:**
- Create: `app/koreader-remote/hooks/use-screen-wake-lock.ts`

- [ ] **Step 1: Create the file**

```ts
// app/koreader-remote/hooks/use-screen-wake-lock.ts
'use client'

import { useEffect, useRef, useState } from 'react'
import NoSleep from 'nosleep.js'

type WakeLockType = 'screen'

type WakeLockSentinel = EventTarget & {
  released: boolean
  release(): Promise<void>
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request(type: WakeLockType): Promise<WakeLockSentinel>
  }
}

export type WakeLockState = {
  isSupported: boolean
  isActive: boolean
  usingFallback: boolean
  requiresUserInteraction: boolean
  error?: string
}

const INITIAL_STATE: WakeLockState = {
  isSupported: false,
  isActive: false,
  usingFallback: false,
  requiresUserInteraction: false,
}

export function useScreenWakeLock(shouldEnable: boolean): WakeLockState {
  const [state, setState] = useState<WakeLockState>(INITIAL_STATE)
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  const noSleepRef = useRef<NoSleep | null>(null)
  const fallbackActiveRef = useRef(false)
  const pointerListenerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return

    let cancelled = false
    const nav =
      typeof navigator !== 'undefined' ? (navigator as NavigatorWithWakeLock) : undefined
    const supportsScreenWakeLock = Boolean(nav?.wakeLock)
    const fallbackAvailable = typeof window !== 'undefined'

    setState((prev) => ({
      ...prev,
      isSupported: supportsScreenWakeLock || fallbackAvailable,
      error: undefined,
    }))

    const handleRelease = () => {
      sentinelRef.current = null
      setState((prev) => ({
        ...prev,
        isActive: fallbackActiveRef.current,
        usingFallback: fallbackActiveRef.current,
      }))
      if (document.visibilityState === 'visible') {
        void requestScreenLock()
      }
    }

    const releaseResources = async () => {
      if (sentinelRef.current) {
        try {
          sentinelRef.current.removeEventListener('release', handleRelease)
          await sentinelRef.current.release()
        } catch (error) {
          console.warn('Failed to release wake lock', error)
        }
        sentinelRef.current = null
      }
      if (fallbackActiveRef.current && noSleepRef.current) {
        try {
          noSleepRef.current.disable()
        } catch (error) {
          console.warn('Failed to disable wake-lock fallback', error)
        }
        fallbackActiveRef.current = false
      }
      setState((prev) => ({
        ...prev,
        isActive: false,
        usingFallback: false,
        requiresUserInteraction: false,
      }))
    }

    const cleanupFallbackListener = () => {
      if (pointerListenerRef.current) {
        document.removeEventListener('pointerdown', pointerListenerRef.current)
        pointerListenerRef.current = null
      }
    }

    const requestFallback = async () => {
      if (!fallbackAvailable || fallbackActiveRef.current) return
      if (!noSleepRef.current) {
        noSleepRef.current = new NoSleep()
      }
      try {
        await noSleepRef.current.enable()
        fallbackActiveRef.current = true
        setState((prev) => ({
          ...prev,
          isActive: true,
          usingFallback: true,
          requiresUserInteraction: false,
          error: undefined,
        }))
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to enable wake-lock fallback.'
        setState((prev) => ({ ...prev, error: message }))
      }
    }

    const enableFallbackListener = () => {
      if (pointerListenerRef.current || !fallbackAvailable) return
      const handlePointer = () => {
        pointerListenerRef.current = null
        void requestFallback()
      }
      pointerListenerRef.current = handlePointer
      document.addEventListener('pointerdown', handlePointer, { once: true })
      setState((prev) => ({ ...prev, requiresUserInteraction: true }))
    }

    const requestScreenLock = async () => {
      if (!supportsScreenWakeLock || !shouldEnable) {
        if (!supportsScreenWakeLock) {
          enableFallbackListener()
        }
        return
      }
      if (sentinelRef.current) return
      try {
        const sentinel = await nav!.wakeLock!.request('screen')
        if (cancelled) {
          await sentinel.release()
          return
        }
        sentinelRef.current = sentinel
        sentinel.addEventListener('release', handleRelease)
        cleanupFallbackListener()
        setState((prev) => ({
          ...prev,
          isActive: true,
          usingFallback: false,
          requiresUserInteraction: false,
          error: undefined,
        }))
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Wake-lock request failed.'
        console.warn('Screen wake-lock request failed', error)
        setState((prev) => ({ ...prev, error: message }))
        enableFallbackListener()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestScreenLock()
      }
    }

    if (!shouldEnable) {
      void releaseResources()
      return
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    void requestScreenLock()

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      cleanupFallbackListener()
      void releaseResources()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldEnable])

  return state
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build succeeds; nosleep.js types resolve through the package's own TypeScript declarations.

- [ ] **Step 3: Commit**

```bash
git add app/koreader-remote/hooks/use-screen-wake-lock.ts
git commit -m "$(cat <<'EOF'
feat(koreader): port useScreenWakeLock hook

Prefers Screen Wake Lock API; falls back to nosleep.js when unavailable
(requires a user gesture, listens for pointerdown). Re-acquires on
visibilitychange so the lock survives tab switches.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add `SiteChrome` wrapper and update root layout

This is the only task that touches every page in the site, so the smoke check is mandatory before committing.

**Files:**
- Create: `components/SiteChrome.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `components/SiteChrome.tsx`**

```tsx
// components/SiteChrome.tsx
'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'

const NAKED_PATHS = ['/koreader-remote']

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const naked = NAKED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
  if (naked) {
    return <>{children}</>
  }
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Update `app/layout.tsx` to use `SiteChrome`**

Replace the existing `<body>` contents. The current file (54 lines) renders `<Header />`, `<main>{children}</main>`, `<Footer />` directly. Change those three lines to a single `<SiteChrome>` wrap.

Final `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Source_Serif_4, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { SiteChrome } from '@/components/SiteChrome'
import '@/styles/tokens.css'
import './globals.css'

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--next-font-serif',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--next-font-sans',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  variable: '--next-font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'Data With Dillon',
    template: '%s | Data With Dillon',
  },
  description:
    'Data engineer and analyst building analytics, pipelines, and AI tooling for healthcare and life-science teams.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: build succeeds. The `Header` import previously in `app/layout.tsx` now lives in `components/SiteChrome.tsx`.

- [ ] **Step 4: Smoke check (mandatory; this touched every page)**

Start the dev server:

```bash
npm run dev
```

Visit the following and confirm each renders correctly with the site Header at the top and Footer at the bottom (no visual regression):

- `http://localhost:3000/`
- `http://localhost:3000/about`
- `http://localhost:3000/dashboards`
- `http://localhost:3000/contact`

Then visit `http://localhost:3000/koreader-remote` and confirm it renders Next.js 404 (the route does not exist yet). The 404 page should show **without** the site Header and Footer because the URL matches `NAKED_PATHS` (this is the wrapper working correctly).

If any of the four real pages lose their Header or Footer, stop and fix `SiteChrome` before continuing.

Stop the dev server (`Ctrl+C`).

- [ ] **Step 5: Commit**

```bash
git add components/SiteChrome.tsx app/layout.tsx
git commit -m "$(cat <<'EOF'
feat(layout): add SiteChrome wrapper for chrome suppression

SiteChrome reads pathname client-side and renders the site Header and
Footer for every route except those in NAKED_PATHS. Replaces the
inline Header/Footer in app/layout.tsx. /koreader-remote (when it
lands) and any future hidden full-bleed routes append to NAKED_PATHS.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Add `X-Robots-Tag` response header

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Replace the contents of `next.config.ts`**

Current file is 6 lines with an empty `NextConfig`. Replace with:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/koreader-remote',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
}

export default nextConfig
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Smoke check (the header should be present even before the page exists)**

Start the dev server:

```bash
npm run dev
```

In a separate shell:

```bash
curl -I http://localhost:3000/koreader-remote 2>/dev/null | grep -i 'x-robots'
```

Expected output:

```
X-Robots-Tag: noindex, nofollow
```

The request will still return a 404 status (page does not exist yet) but the header is applied to the route regardless. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "$(cat <<'EOF'
feat(config): set X-Robots-Tag: noindex on /koreader-remote

Belt-and-suspenders alongside the per-route metadata.robots flag
(added with the page in a later task). Deliberately no robots.txt
entry to avoid advertising the URL publicly.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Create `SwipeShell`

A full-viewport container that listens for horizontal swipes and dispatches a `koreader-swipe` `CustomEvent` on `window`. Renders `children` so the orchestrator can compose freely.

**Files:**
- Create: `app/koreader-remote/SwipeShell.tsx`
- Create: `app/koreader-remote/SwipeShell.module.css`

- [ ] **Step 1: Create `SwipeShell.module.css`**

```css
/* app/koreader-remote/SwipeShell.module.css */
.shell {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  display: flex;
  align-items: stretch;
  overscroll-behavior: none;
  touch-action: pan-y;
}
```

- [ ] **Step 2: Create `SwipeShell.tsx`**

```tsx
// app/koreader-remote/SwipeShell.tsx
'use client'

import { useRef } from 'react'
import styles from './SwipeShell.module.css'
import type { KoreaderActionId } from '@/lib/koreader/client'

const MIN_SWIPE_PX = 40

export function SwipeShell({ children }: { children: React.ReactNode }) {
  const swipeRef = useRef<{ startX: number; width: number } | null>(null)

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!event.touches[0]) return
    swipeRef.current = {
      startX: event.touches[0].clientX,
      width: event.currentTarget.clientWidth,
    }
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const swipe = swipeRef.current
    swipeRef.current = null
    if (!swipe || !event.changedTouches[0]) return
    const deltaX = event.changedTouches[0].clientX - swipe.startX
    if (Math.abs(deltaX) < MIN_SWIPE_PX) return
    const startArea = swipe.startX < swipe.width / 2 ? 'left' : 'right'
    const action: KoreaderActionId | null =
      startArea === 'left' && deltaX > 0
        ? 'prev'
        : startArea === 'right' && deltaX < 0
          ? 'next'
          : null
    if (!action) return
    window.dispatchEvent(
      new CustomEvent('koreader-swipe', { detail: { action } }),
    )
  }

  return (
    <div
      className={styles.shell}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/koreader-remote/SwipeShell.tsx app/koreader-remote/SwipeShell.module.css
git commit -m "$(cat <<'EOF'
feat(koreader): add SwipeShell gesture wrapper

Detects >40px horizontal swipes starting in the matching viewport
half and dispatches a koreader-swipe CustomEvent on window. CSS
sets touch-action: pan-y so vertical scroll still works.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Create `RemoteButton`

The big tap-target primitive. Stateless presentation: `pressed` and `disabled` come from the parent.

**Files:**
- Create: `app/koreader-remote/RemoteButton.tsx`
- Create: `app/koreader-remote/RemoteButton.module.css`

- [ ] **Step 1: Create `RemoteButton.module.css`**

```css
/* app/koreader-remote/RemoteButton.module.css */
.button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: var(--space-5);

  background: transparent;
  color: var(--color-paper);
  border: var(--rule-hairline) solid
    color-mix(in srgb, var(--color-paper) 22%, transparent);
  border-radius: var(--radius-sm);

  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  line-height: var(--leading-tight);

  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.button:focus-visible {
  outline: var(--rule-medium) solid var(--color-paper);
  outline-offset: var(--space-1);
}

.button.pressed {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-paper);
}

.button:disabled {
  cursor: not-allowed;
  color: color-mix(in srgb, var(--color-paper) 30%, transparent);
  border-color: color-mix(in srgb, var(--color-paper) 12%, transparent);
}

.label {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
}

.hint {
  margin-top: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: color-mix(in srgb, var(--color-paper) 55%, transparent);
}

.button.pressed .hint {
  color: color-mix(in srgb, var(--color-paper) 75%, transparent);
}

.button:disabled .hint {
  color: color-mix(in srgb, var(--color-paper) 20%, transparent);
}
```

- [ ] **Step 2: Create `RemoteButton.tsx`**

```tsx
// app/koreader-remote/RemoteButton.tsx
'use client'

import styles from './RemoteButton.module.css'
import type { KoreaderActionId } from '@/lib/koreader/client'

type Props = {
  action: KoreaderActionId
  label: string
  hint?: string
  pressed?: boolean
  disabled?: boolean
  onPress: () => void
}

export function RemoteButton({
  action,
  label,
  hint,
  pressed = false,
  disabled = false,
  onPress,
}: Props) {
  return (
    <button
      type="button"
      data-action={action}
      className={`${styles.button} ${pressed ? styles.pressed : ''}`}
      disabled={disabled}
      onClick={onPress}
    >
      <span className={styles.label}>{label}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </button>
  )
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/koreader-remote/RemoteButton.tsx app/koreader-remote/RemoteButton.module.css
git commit -m "$(cat <<'EOF'
feat(koreader): add RemoteButton primitive

Stateless big tap target. Default state is transparent with a hairline
border in paper@22%; pressed state fills with accent (oxblood).
disabled drops the border and label to muted alphas. No shadow, 2px
radius, per the design system.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Create `StatusBar`

Single-line tone-aware status with a leading glyph that picks up the tone color.

**Files:**
- Create: `app/koreader-remote/StatusBar.tsx`
- Create: `app/koreader-remote/StatusBar.module.css`

- [ ] **Step 1: Create `StatusBar.module.css`**

```css
/* app/koreader-remote/StatusBar.module.css */
.bar {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: var(--rule-hairline) solid
    color-mix(in srgb, var(--color-paper) 22%, transparent);
  color: var(--color-paper);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
}

.glyph {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  flex-shrink: 0;
}

.toneIdle    { color: var(--color-paper); }
.tonePending { color: var(--color-warn); }
.toneSuccess { color: var(--color-positive); }
.toneError   { color: var(--color-accent); }

.message {
  color: var(--color-paper);
}

.detail {
  color: color-mix(in srgb, var(--color-paper) 55%, transparent);
}

.divider {
  color: color-mix(in srgb, var(--color-paper) 35%, transparent);
  padding: 0 var(--space-1);
}
```

- [ ] **Step 2: Create `StatusBar.tsx`**

```tsx
// app/koreader-remote/StatusBar.tsx
'use client'

import styles from './StatusBar.module.css'

export type StatusTone = 'idle' | 'pending' | 'success' | 'error'

type Props = {
  tone: StatusTone
  message: string
  detail?: string
}

const GLYPHS: Record<StatusTone, string> = {
  idle: '▸',
  pending: '◌',
  success: '✓',
  error: '!',
}

const TONE_CLASS: Record<StatusTone, string> = {
  idle: styles.toneIdle,
  pending: styles.tonePending,
  success: styles.toneSuccess,
  error: styles.toneError,
}

export function StatusBar({ tone, message, detail }: Props) {
  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <span className={`${styles.glyph} ${TONE_CLASS[tone]}`}>{GLYPHS[tone]}</span>
      <span className={styles.message}>{message}</span>
      {detail ? (
        <>
          <span className={styles.divider}>·</span>
          <span className={styles.detail}>{detail}</span>
        </>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/koreader-remote/StatusBar.tsx app/koreader-remote/StatusBar.module.css
git commit -m "$(cat <<'EOF'
feat(koreader): add StatusBar with tone-aware glyph

Glyph picks up tone color (idle paper, pending warn, success positive,
error accent); message text stays paper. Optional detail trails after
a muted middle-dot.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Create `SetupModal`

The endpoint configuration overlay. Wraps `useKoreaderEndpoint`'s `inputValue`/`saveEndpoint` interface. Intro copy is shown until `dwd:koreader:intro:v1` is set.

**Files:**
- Create: `app/koreader-remote/SetupModal.tsx`
- Create: `app/koreader-remote/SetupModal.module.css`

- [ ] **Step 1: Create `SetupModal.module.css`**

```css
/* app/koreader-remote/SetupModal.module.css */
.scrim {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-ink) 92%, transparent);
  padding: var(--space-4);
}

.card {
  width: min(420px, 100%);
  background: var(--color-ink);
  border: var(--rule-hairline) solid
    color-mix(in srgb, var(--color-paper) 22%, transparent);
  border-radius: var(--radius-sm);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  color: var(--color-paper);
}

.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.title {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  margin: 0;
}

.closeButton {
  background: none;
  border: none;
  color: color-mix(in srgb, var(--color-paper) 70%, transparent);
  font-family: var(--font-mono);
  font-size: var(--text-base);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
}

.closeButton:focus-visible {
  outline: var(--rule-medium) solid var(--color-paper);
  outline-offset: var(--space-1);
}

.intro {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: color-mix(in srgb, var(--color-paper) 75%, transparent);
  margin: 0;
}

.fieldLabel {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: color-mix(in srgb, var(--color-paper) 70%, transparent);
}

.input {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  color: var(--color-paper);
  background: transparent;
  border: none;
  border-bottom: var(--rule-hairline) solid
    color-mix(in srgb, var(--color-paper) 35%, transparent);
  padding: var(--space-2) 0;
}

.input:focus {
  outline: none;
  border-bottom-color: var(--color-paper);
}

.input::placeholder {
  color: color-mix(in srgb, var(--color-paper) 30%, transparent);
}

.errorText {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-accent);
  margin: 0;
}

.savedText {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: color-mix(in srgb, var(--color-paper) 55%, transparent);
  margin: 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.saveButton {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  background: var(--color-accent);
  color: var(--color-paper);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-5);
  cursor: pointer;
}

.saveButton:hover {
  background: var(--color-accent-hover);
}

.saveButton:disabled {
  cursor: not-allowed;
  background: color-mix(in srgb, var(--color-accent) 50%, transparent);
}

.saveButton:focus-visible {
  outline: var(--rule-medium) solid var(--color-paper);
  outline-offset: var(--space-1);
}
```

- [ ] **Step 2: Create `SetupModal.tsx`**

```tsx
// app/koreader-remote/SetupModal.tsx
'use client'

import { useEffect, useState } from 'react'
import styles from './SetupModal.module.css'
import type { useKoreaderEndpoint } from './hooks/use-koreader-endpoint'

const INTRO_STORAGE_KEY = 'dwd:koreader:intro:v1'

type Props = {
  open: boolean
  onClose: () => void
  endpoint: ReturnType<typeof useKoreaderEndpoint>
}

export function SetupModal({ open, onClose, endpoint }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [introSeen, setIntroSeen] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIntroSeen(window.localStorage.getItem(INTRO_STORAGE_KEY) === 'seen')
  }, [])

  if (!open) return null

  function handleSave() {
    const result = endpoint.saveEndpoint()
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(INTRO_STORAGE_KEY, 'seen')
    }
    setIntroSeen(true)
    onClose()
  }

  function handleClose() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(INTRO_STORAGE_KEY, 'seen')
    }
    setIntroSeen(true)
    onClose()
  }

  return (
    <div className={styles.scrim} role="dialog" aria-modal="true" aria-label="KOReader setup">
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>KOReader endpoint</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close setup"
          >
            ×
          </button>
        </div>

        {!introSeen ? (
          <p className={styles.intro}>
            Point the remote at your KOReader HTTP Inspector. Same Wi-Fi only.
            The endpoint is stored only in this browser.
          </p>
        ) : null}

        <label className={styles.fieldLabel}>
          Endpoint
          <input
            className={styles.input}
            type="text"
            inputMode="url"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="192.168.1.67:8080"
            value={endpoint.inputValue}
            onChange={(e) => {
              endpoint.setInputValue(e.target.value)
              if (error) setError(null)
            }}
            disabled={!endpoint.isReady}
          />
        </label>

        {error ? <p className={styles.errorText}>{error}</p> : null}
        {!error && endpoint.savedAt ? (
          <p className={styles.savedText}>Saved to this browser.</p>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!endpoint.isReady}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/koreader-remote/SetupModal.tsx app/koreader-remote/SetupModal.module.css
git commit -m "$(cat <<'EOF'
feat(koreader): add SetupModal for endpoint configuration

Centered card on a near-opaque ink scrim. Mono input with an
underline-only style; oxblood Save CTA. Intro copy shown once
(gated by localStorage dwd:koreader:intro:v1). Closes on Save or X.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Create the `RemotePanel` orchestrator

This is the largest component. It owns the command queue, the connection probing state machine, the swipe-event listener, and composes all the primitives.

**Files:**
- Create: `app/koreader-remote/RemotePanel.tsx`
- Create: `app/koreader-remote/RemotePanel.module.css`

- [ ] **Step 1: Create `RemotePanel.module.css`**

```css
/* app/koreader-remote/RemotePanel.module.css */
.root {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-ink);
  color: var(--color-paper);
  overscroll-behavior: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: var(--rule-hairline) solid
    color-mix(in srgb, var(--color-paper) 22%, transparent);
}

.title {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  margin: 0;
  color: var(--color-paper);
}

.setupButton {
  background: none;
  border: none;
  color: color-mix(in srgb, var(--color-paper) 75%, transparent);
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
}

.setupButton:hover {
  color: var(--color-paper);
}

.setupButton:focus-visible {
  outline: var(--rule-medium) solid var(--color-paper);
  outline-offset: var(--space-1);
}

.grid {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  padding: var(--space-4);
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}
```

- [ ] **Step 2: Create `RemotePanel.tsx`**

```tsx
// app/koreader-remote/RemotePanel.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './RemotePanel.module.css'
import { RemoteButton } from './RemoteButton'
import { StatusBar, type StatusTone } from './StatusBar'
import { SetupModal } from './SetupModal'
import { SwipeShell } from './SwipeShell'
import { useKoreaderEndpoint } from './hooks/use-koreader-endpoint'
import { useScreenWakeLock } from './hooks/use-screen-wake-lock'
import {
  KOREADER_ACTIONS,
  prefetchKoreaderConnection,
  sendKoreaderCommand,
  warmKoreaderEndpoint,
  type KoreaderActionId,
} from '@/lib/koreader/client'

type Status = {
  tone: StatusTone
  message: string
  detail?: string
}

const QUICK_ATTEMPTS = 3
const QUICK_DELAY_MS = 250
const FALLBACK_DELAY_MS = 3000
const QUEUE_SPACING_MS = 150

export function RemotePanel() {
  const endpoint = useKoreaderEndpoint()
  useScreenWakeLock(true)

  const [status, setStatus] = useState<Status>({
    tone: 'idle',
    message: 'Loading',
  })
  const [activeAction, setActiveAction] = useState<KoreaderActionId | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const queueRef = useRef<KoreaderActionId[]>([])
  const processingRef = useRef(false)
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Open the modal automatically when there is no endpoint yet.
  useEffect(() => {
    if (!endpoint.isReady) return
    if (!endpoint.hasEndpoint) {
      setIsPanelOpen(true)
      setStatus({
        tone: 'idle',
        message: 'Configure endpoint to start',
      })
    }
  }, [endpoint.isReady, endpoint.hasEndpoint])

  // Connection probe loop: 3 quick probes then 3s polling until success.
  useEffect(() => {
    if (!endpoint.isReady || !endpoint.hasEndpoint) return

    let cancelled = false
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null

    const detail = endpoint.endpoint

    setStatus({ tone: 'pending', message: 'Connecting', detail })

    async function quickProbes(): Promise<boolean> {
      for (let i = 0; i < QUICK_ATTEMPTS; i += 1) {
        const result = await warmKoreaderEndpoint(endpoint.endpoint)
        if (cancelled) return false
        if (result.ok) {
          setIsConnected(true)
          setStatus({ tone: 'idle', message: 'Ready', detail })
          return true
        }
        await new Promise((r) => setTimeout(r, QUICK_DELAY_MS))
      }
      return false
    }

    async function pollUntilConnected() {
      const tick = async () => {
        if (cancelled) return
        const result = await warmKoreaderEndpoint(endpoint.endpoint)
        if (cancelled) return
        if (result.ok) {
          setIsConnected(true)
          setStatus({ tone: 'idle', message: 'Ready', detail })
          return
        }
        fallbackTimer = setTimeout(tick, FALLBACK_DELAY_MS)
      }
      void tick()
    }

    void quickProbes().then((ok) => {
      if (cancelled || ok) return
      void pollUntilConnected()
    })

    return () => {
      cancelled = true
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [endpoint.isReady, endpoint.hasEndpoint, endpoint.endpoint])

  const schedulePrefetch = useCallback(
    (action: KoreaderActionId) => {
      if (!endpoint.endpoint) return
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current)
      const delay = action === 'next' ? 125 : 175
      prefetchTimerRef.current = setTimeout(() => {
        prefetchTimerRef.current = null
        void prefetchKoreaderConnection(endpoint.endpoint)
      }, delay)
    },
    [endpoint.endpoint],
  )

  const processQueue = useCallback(async () => {
    if (processingRef.current) return
    processingRef.current = true
    try {
      while (queueRef.current.length > 0) {
        const actionId = queueRef.current.shift()!
        if (!endpoint.hasEndpoint) {
          setStatus({
            tone: 'error',
            message: 'No endpoint configured',
            detail: 'Open setup to add your KOReader IP and port.',
          })
          continue
        }
        const action = KOREADER_ACTIONS[actionId]
        setActiveAction(actionId)
        setStatus({ tone: 'pending', message: `Sending ${action.label}` })
        const result = await sendKoreaderCommand(endpoint.endpoint, actionId)
        setActiveAction(null)
        if (result.ok) {
          setStatus({ tone: 'success', message: `${action.label} sent` })
          schedulePrefetch(actionId)
        } else {
          setStatus({
            tone: 'error',
            message: `Unable to send ${action.label}`,
            detail: result.error,
          })
          setIsConnected(false)
          queueRef.current = []
          break
        }
        await new Promise((r) => setTimeout(r, QUEUE_SPACING_MS))
      }
    } finally {
      processingRef.current = false
    }
  }, [endpoint.endpoint, endpoint.hasEndpoint, schedulePrefetch])

  const enqueue = useCallback(
    (actionId: KoreaderActionId) => {
      queueRef.current.push(actionId)
      void processQueue()
    },
    [processQueue],
  )

  // Swipe shell dispatches koreader-swipe on window; convert to a queued action.
  useEffect(() => {
    function handleSwipe(event: Event) {
      const custom = event as CustomEvent<{ action: KoreaderActionId }>
      if (!custom.detail?.action) return
      enqueue(custom.detail.action)
    }
    window.addEventListener('koreader-swipe', handleSwipe as EventListener)
    return () =>
      window.removeEventListener('koreader-swipe', handleSwipe as EventListener)
  }, [enqueue])

  // Reflect connection lost in the idle status detail line.
  useEffect(() => {
    if (endpoint.hasEndpoint && !isConnected && status.tone === 'idle') {
      setStatus((prev) => ({ ...prev, message: 'Connecting' }))
    }
  }, [endpoint.hasEndpoint, isConnected, status.tone])

  useEffect(
    () => () => {
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current)
    },
    [],
  )

  const disabled = !endpoint.hasEndpoint || activeAction !== null

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>KOReader Remote</h1>
        <button
          type="button"
          className={styles.setupButton}
          onClick={() => setIsPanelOpen(true)}
          aria-label="Open setup"
        >
          ⚙
        </button>
      </header>

      <SwipeShell>
        <div className={styles.grid}>
          <RemoteButton
            action="prev"
            label="Prev"
            hint="swipe ←"
            pressed={activeAction === 'prev'}
            disabled={disabled}
            onPress={() => enqueue('prev')}
          />
          <RemoteButton
            action="next"
            label="Next"
            hint="swipe →"
            pressed={activeAction === 'next'}
            disabled={disabled}
            onPress={() => enqueue('next')}
          />
        </div>
      </SwipeShell>

      <StatusBar tone={status.tone} message={status.message} detail={status.detail} />

      <SetupModal
        open={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        endpoint={endpoint}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/koreader-remote/RemotePanel.tsx app/koreader-remote/RemotePanel.module.css
git commit -m "$(cat <<'EOF'
feat(koreader): add RemotePanel orchestrator

Owns the command queue (single-in-flight, 150ms spacing), the connection
probe state machine (3x250ms quick probes then 3s polling), the
koreader-swipe window listener, and the modal open/closed state. Wires
RemoteButton, StatusBar, SetupModal, and SwipeShell into the dark
full-bleed layout from the design spec.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Create the route page

This is the moment `/koreader-remote` becomes reachable.

**Files:**
- Create: `app/koreader-remote/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/koreader-remote/page.tsx
import type { Metadata, Viewport } from 'next'
import { RemotePanel } from './RemotePanel'

export const metadata: Metadata = {
  title: 'KOReader Remote',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function Page() {
  return <RemotePanel />
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build succeeds; `/koreader-remote` is now part of the route manifest.

- [ ] **Step 3: Smoke check**

```bash
npm run dev
```

Visit `http://localhost:3000/koreader-remote` in a browser:

- The page renders full-bleed dark on `--color-ink`. No site Header or Footer.
- Without a configured endpoint (open in an incognito window for a clean slate): the `SetupModal` is open. Save with no input → inline error appears. Type `192.168.1.67:8080` (or your real KOReader IP if you want a real-network smoke), Save → modal closes, status switches to "Connecting · http://192.168.1.67:8080".
- View page source: `<meta name="robots" content="noindex, nofollow">` is present.
- DevTools Network panel → click the document request for `/koreader-remote` → headers should include `X-Robots-Tag: noindex, nofollow`.
- Tap **Prev** → button flashes oxblood briefly, status reads "Sending Previous Page" then either "Previous Page sent" (success) or "Unable to send Previous Page" with detail (error, if no real KOReader is reachable). Repeat with **Next**.
- DevTools touch emulation: left-edge left-swipe inside the button area triggers Prev; right-edge right-swipe triggers Next.
- Click `⚙` → modal reopens. Close `×` → modal closes.
- Visit `http://localhost:3000/` → Header and Footer present (regression check on `SiteChrome`).

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/koreader-remote/page.tsx
git commit -m "$(cat <<'EOF'
feat(koreader): add /koreader-remote route

Server component exporting metadata.robots = noindex, nofollow and a
viewport that disables user-scaling. Renders the client RemotePanel.
Combined with the X-Robots-Tag header on this route and absence from
nav/footer/dashboards/RSS, the page is reachable only by direct URL.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Final verification and link-leak audit

No code changes. Final checks to confirm the feature is hidden everywhere it should be and the build is clean.

- [ ] **Step 1: Production build**

```bash
npm run build
```

Expected: build succeeds with no type errors. `/koreader-remote` appears in the route manifest.

- [ ] **Step 2: Link-leak audit**

```bash
rg -n 'koreader-remote' app components
```

Expected: matches only in
- `app/koreader-remote/**` (the feature itself)
- `components/SiteChrome.tsx` (the `NAKED_PATHS` array)
- (No matches in `app/dashboards/page.tsx`, `app/rss/route.ts`, `components/Header.tsx`, `components/MobileDrawer.tsx`, `components/Footer.tsx`.)

If any of the other listed files contain a match, that match must be removed before the feature ships.

```bash
rg -n 'koreader' next.config.ts
```

Expected: one match, the `/koreader-remote` source line in `headers()`.

- [ ] **Step 3: Confirm no other surfaces enumerate the route**

Verify there is no `app/sitemap.ts` or `app/robots.ts` in the repo:

```bash
ls app/sitemap.* app/robots.* 2>/dev/null
```

Expected: no files (the command prints nothing). If either file appears in a future change, the route must be excluded from it.

- [ ] **Step 4: Production smoke (optional but recommended before deploy)**

```bash
npm run build && npm run start
```

In a second shell:

```bash
curl -sI http://localhost:3000/koreader-remote | grep -i 'x-robots'
```

Expected: `X-Robots-Tag: noindex, nofollow`.

```bash
curl -s http://localhost:3000/koreader-remote | grep -o '<meta name="robots"[^>]*>'
```

Expected: `<meta name="robots" content="noindex, nofollow">`.

Stop the server.

- [ ] **Step 5: Merge gate (the only test that proves the feature works end-to-end)**

Deploy the branch to a Vercel preview. Open the preview URL on a phone over **cellular** (not the home Wi-Fi). Open `/koreader-remote`. Configure the real KOReader endpoint. While the KOReader is connected to the home Wi-Fi, tap Prev and Next. Confirm the device responds.

If the device does not respond, the most likely cause is the inherited mixed-content risk (HTTPS page calling HTTP LAN endpoint); see "Known risks" in the spec. That investigation is out of scope for this migration; do not silently abandon the merge if the real-device path fails. Either keep digging until it works, or surface the failure and decide with the user how to proceed.

---

## Self-review checklist (already run by the author)

- ✅ All spec sections covered:
  - File plan → Tasks 2-12.
  - `SiteChrome` rationale → Task 5.
  - Dependencies → Task 1.
  - `lib/koreader/client.ts` API → Task 2.
  - `useKoreaderEndpoint` → Task 3.
  - `useScreenWakeLock` → Task 4.
  - `SwipeShell` → Task 7.
  - `RemoteButton` → Task 8.
  - `StatusBar` → Task 9.
  - `SetupModal` → Task 10.
  - `RemotePanel` → Task 11.
  - `page.tsx` (metadata, viewport) → Task 12.
  - Hide-from-crawlers (per-route metadata + `X-Robots-Tag` + no robots.txt + no nav/footer links) → Tasks 6, 12, 13.
  - Visual design tokens / dark palette / hairline borders / no shadows → Tasks 8-11 CSS Modules.
  - Verification → Tasks 5, 6, 12, 13.

- ✅ No placeholders: every step shows code, every command shows expected output where useful.

- ✅ Type consistency: `KoreaderActionId` (not `KOReaderAction`) used throughout; `KOREADER_ACTIONS[id].label` reads consistently in `RemotePanel`; `useScreenWakeLock(true)` takes the boolean argument the hook expects; `useKoreaderEndpoint`'s `saveEndpoint()` takes no arguments in every caller.

- ✅ No em or en dashes anywhere in the plan copy or code strings.
