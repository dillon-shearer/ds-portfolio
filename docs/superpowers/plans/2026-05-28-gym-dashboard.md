# Gym Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the gym tracker from `/Users/dillon/Desktop/projects/dillon-shearer-website` into the portfolio at `/dashboards/gym`, establishing a reusable `components/dashboard/` framework along the way.

**Architecture:** Layer 1 is eight generic framework primitives (`components/dashboard/`) that know nothing about gym data. Layer 2 is gym-specific panels, form, and chat widget that consume the framework. Layer 3 is the data layer (lib/gym-chat, API routes, server actions) copied verbatim with path corrections only.

**Tech Stack:** Next.js 15 App Router, TypeScript, CSS Modules, `@vercel/postgres`, Recharts, `@react-three/fiber` + Three.js, OpenAI via `lib/gym-chat`, `react-markdown`, `pgsql-ast-parser`

**Source project:** `/Users/dillon/Desktop/projects/dillon-shearer-website` (read-only reference)

**Critical rules (read before touching any file):**
- Read `.claude/STYLE.md` and `.claude/AGENTS.md` in full before any UI work
- Every color/spacing/font must use a CSS variable from `styles/tokens.css` — no raw hex values
- No `border-radius` > 2px, no `box-shadow`, no gradients, no em/en dashes in copy
- **DO NOT modify the Neon PostgreSQL database schema, tables, or data in any way**
- No `npm run test` exists — verification is `npm run build` (TypeScript + Next.js build)

---

## File Map

```
# New
styles/tokens.css                                 — add chart color tokens (modify)
app/globals.css                                   — add .page-wrapper--wide (modify)

components/dashboard/
  DashboardShell.tsx + .module.css
  DashboardPanel.tsx + .module.css
  StatWidget.tsx + .module.css
  ChartWrapper.tsx + .module.css
  TimeRangeSelector.tsx + .module.css
  PasswordGate.tsx + .module.css
  FloatingChatWidget.tsx + .module.css
  Pager.tsx + .module.css

types/gym-chat.ts                                 — copy from source
lib/gym-chat/                                     — copy all 12 modules from source
app/api/gym-chat/route.ts                         — copy from source
app/api/gym-data/route.ts                         — copy + audit from source
app/api/gym-data.csv/route.ts                     — copy + audit from source

app/dashboards/gym/
  page.tsx                                        — server component, fetches lifts
  GymDashboard.tsx + .module.css                  — client orchestrator
  actions.ts                                      — port from source form/actions.ts
  catalog.ts                                      — port from source catalog.ts

  panels/
    VolumeChart.tsx + .module.css
    SplitFrequency.tsx + .module.css
    BodyPartFrequency.tsx + .module.css
    BodyDiagram.tsx + .module.css
    ExercisePRsTable.tsx + .module.css
    VolumeHeatmap.tsx + .module.css
    RecentSessions.tsx + .module.css
    DailyView/
      index.tsx + index.module.css
      SevenDayStrip.tsx + .module.css
      CumulativeVolumeChart.tsx + .module.css
      MuscleVolumeDonut.tsx + .module.css
      ExerciseTable.tsx + .module.css

  form/
    WorkoutForm.tsx + .module.css
    ExerciseManagerModal.tsx + .module.css
    BodyPartsSheet.tsx + .module.css
    DayInfoSheet.tsx + .module.css
    EditSetModal.tsx + .module.css

# Modified
app/dashboards/page.tsx                           — add gym DashboardCard entry
```

---

## Task 1: Install packages and configure environment

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`

- [ ] **Install new packages**

```bash
npm install recharts @react-three/fiber three @vercel/postgres react-markdown pgsql-ast-parser
npm install --save-dev @types/three
```

Expected: packages added to `package.json`, no errors.

- [ ] **Add env vars to `.env.local`**

Open `/Users/dillon/Desktop/projects/dillon-shearer-website/.env.local` and copy these variables into the portfolio's `.env.local`:

```
DATABASE_URL=<value from source>
DATABASE_URL_UNPOOLED=<value from source>
GYM_CHAT_DATABASE_URL_READONLY=<value from source>
OPENAI_API_KEY=<value from source>
LIFT_PASSWORD=<value from source>
```

- [ ] **Verify build still passes**

```bash
npm run build
```

Expected: Build succeeds (no new errors from the package additions).

- [ ] **Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install recharts, three, vercel/postgres, react-markdown for gym dashboard"
```

---

## Task 2: Add chart tokens and wide layout CSS

**Files:**
- Modify: `styles/tokens.css`
- Modify: `app/globals.css`

- [ ] **Add chart color tokens to `styles/tokens.css`**

Append inside the `:root {}` block, after `--color-warn`:

```css
  /* ---------- Chart palette ---------- */
  /* Body part colors — earthy, distinguishable, portfolio-consistent */
  --chart-bp-chest:      #7A2E2E;
  --chart-bp-back:       #4A4239;
  --chart-bp-shoulders:  #B8893B;
  --chart-bp-biceps:     #4A6B3A;
  --chart-bp-triceps:    #8A7F71;
  --chart-bp-quads:      #5C3A1A;
  --chart-bp-hamstrings: #1A4A3A;
  --chart-bp-core:       #3A1A4A;
  --chart-bp-glutes:     #9A5A3A;
  --chart-bp-calves:     #3A6B5A;
  --chart-bp-forearms:   #6B6B3A;
  --chart-bp-hips:       #5A3A6B;

  /* Generic chart series (for non-body-part charts) */
  --chart-primary:   #7A2E2E;
  --chart-secondary: #4A4239;
  --chart-muted:     #D8CFC2;
  --chart-na:        #EBE3D5;
```

- [ ] **Add `.page-wrapper--wide` to `app/globals.css`**

Find the `.page-wrapper` rule and add a modifier below it:

```css
.page-wrapper--wide {
  max-width: var(--content-width-wide);
  margin: 0 auto;
  padding: var(--space-8) var(--gutter);
}

@media (min-width: 720px) {
  .page-wrapper--wide {
    padding-left: var(--space-7);
    padding-right: var(--space-7);
  }
}
```

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add styles/tokens.css app/globals.css
git commit -m "feat: add chart color tokens and wide layout wrapper"
```

---

## Task 3: Copy types and data layer

**Files:**
- Create: `types/gym-chat.ts`
- Create: `lib/gym-chat/` (12 files)
- Create: `app/api/gym-chat/route.ts`
- Create: `app/api/gym-data/route.ts`
- Create: `app/api/gym-data.csv/route.ts`

- [ ] **Copy types**

```bash
cp /Users/dillon/Desktop/projects/dillon-shearer-website/types/gym-chat.ts types/gym-chat.ts
```

- [ ] **Copy lib/gym-chat modules**

```bash
mkdir -p lib/gym-chat
cp /Users/dillon/Desktop/projects/dillon-shearer-website/lib/gym-chat/*.ts lib/gym-chat/
```

- [ ] **Copy API routes**

```bash
mkdir -p app/api/gym-chat app/api/gym-data "app/api/gym-data.csv"
cp /Users/dillon/Desktop/projects/dillon-shearer-website/app/api/gym-chat/route.ts app/api/gym-chat/route.ts
cp /Users/dillon/Desktop/projects/dillon-shearer-website/app/api/gym-data/route.ts app/api/gym-data/route.ts
cp "/Users/dillon/Desktop/projects/dillon-shearer-website/app/api/gym-data.csv/route.ts" "app/api/gym-data.csv/route.ts"
```

- [ ] **Fix import paths in gym-chat API route**

Open `app/api/gym-chat/route.ts`. The imports use `@/lib/gym-chat/` and `@/types/gym-chat` — these are already correct for the portfolio since the files are in the same locations. Verify no path changes are needed by reading the top 30 lines:

```bash
head -30 app/api/gym-chat/route.ts
```

Expected: All imports start with `@/lib/gym-chat/` or `@/types/gym-chat` — no changes needed.

- [ ] **Verify build**

```bash
npm run build
```

Fix any TypeScript errors in the copied files (likely none, but check).

- [ ] **Commit**

```bash
git add types/gym-chat.ts lib/gym-chat/ app/api/gym-chat/ app/api/gym-data/ "app/api/gym-data.csv/"
git commit -m "feat: copy gym-chat data layer (lib, api routes, types)"
```

---

## Task 4: Port server actions and catalog

**Files:**
- Create: `app/dashboards/gym/actions.ts`
- Create: `app/dashboards/gym/catalog.ts`

- [ ] **Copy and fix actions.ts**

```bash
mkdir -p app/dashboards/gym
cp /Users/dillon/Desktop/projects/dillon-shearer-website/app/demos/gym-dashboard/form/actions.ts app/dashboards/gym/actions.ts
```

Open `app/dashboards/gym/actions.ts` and make these changes:

1. Change the catalog import path (line ~6):
   ```ts
   // Before:
   import { listExercises } from '../catalog'
   // After:
   import { listExercises } from './catalog'
   ```

2. Change the `DASHBOARD_PATH` constant (line ~42):
   ```ts
   // Before:
   const DASHBOARD_PATH = '/demos/gym-dashboard'
   // After:
   const DASHBOARD_PATH = '/dashboards/gym'
   ```

3. Find all `revalidatePath(DASHBOARD_PATH)` calls — verify they use the constant (no hardcoded strings to change).

- [ ] **Copy and fix catalog.ts**

```bash
cp /Users/dillon/Desktop/projects/dillon-shearer-website/app/demos/gym-dashboard/catalog.ts app/dashboards/gym/catalog.ts
```

Open `app/dashboards/gym/catalog.ts` and update `revalidatePath` if it references the old path (search for `/demos/gym-dashboard`):

```bash
grep -n "demos/gym-dashboard" app/dashboards/gym/catalog.ts
```

Replace any occurrences with `/dashboards/gym`.

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add app/dashboards/gym/actions.ts app/dashboards/gym/catalog.ts
git commit -m "feat: port gym server actions and exercise catalog"
```

---

## Task 5: Framework primitives — DashboardPanel, StatWidget, Pager

**Files:**
- Create: `components/dashboard/DashboardPanel.tsx`
- Create: `components/dashboard/DashboardPanel.module.css`
- Create: `components/dashboard/StatWidget.tsx`
- Create: `components/dashboard/StatWidget.module.css`
- Create: `components/dashboard/Pager.tsx`
- Create: `components/dashboard/Pager.module.css`

- [ ] **Create `components/dashboard/DashboardPanel.tsx`**

```tsx
import styles from './DashboardPanel.module.css'

type Props = {
  eyebrow?: string
  children: React.ReactNode
  className?: string
}

export default function DashboardPanel({ eyebrow, children, className }: Props) {
  return (
    <section className={[styles.panel, className].filter(Boolean).join(' ')}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      {children}
    </section>
  )
}
```

- [ ] **Create `components/dashboard/DashboardPanel.module.css`**

```css
.panel {
  border-top: var(--rule-hairline) solid var(--color-rule);
  padding: var(--space-5) 0;
}

.eyebrow {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
  margin-bottom: var(--space-4);
}
```

- [ ] **Create `components/dashboard/StatWidget.tsx`**

```tsx
import styles from './StatWidget.module.css'

type Props = {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

export default function StatWidget({ label, value, sub, accent }: Props) {
  return (
    <div className={styles.widget}>
      <p className={styles.label}>{label}</p>
      <p className={[styles.value, accent ? styles.accent : ''].join(' ')}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className={styles.sub}>{sub}</p>}
    </div>
  )
}
```

- [ ] **Create `components/dashboard/StatWidget.module.css`**

```css
.widget {
  border-top: var(--rule-medium) solid var(--color-ink);
  border-bottom: var(--rule-hairline) solid var(--color-rule);
  padding: var(--space-4) 0;
}

.label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
  margin-bottom: var(--space-2);
}

.value {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  font-weight: 400;
  line-height: var(--leading-tight);
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
}

.accent {
  color: var(--color-accent);
}

.sub {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
  margin-top: var(--space-1);
}
```

- [ ] **Create `components/dashboard/Pager.tsx`**

```tsx
import styles from './Pager.module.css'

type Props = {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export default function Pager({ page, totalPages, onPrev, onNext }: Props) {
  return (
    <div className={styles.pager}>
      <button
        className={styles.btn}
        onClick={onPrev}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ← Prev
      </button>
      <span className={styles.count}>{page} / {Math.max(1, totalPages)}</span>
      <button
        className={styles.btn}
        onClick={onNext}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        Next →
      </button>
    </div>
  )
}
```

- [ ] **Create `components/dashboard/Pager.module.css`**

```css
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-4);
  border-top: var(--rule-hairline) solid var(--color-rule-soft);
}

.btn {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-2);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color var(--duration-fast) var(--ease-out);
}

.btn:hover {
  color: var(--color-ink);
}

.btn:disabled {
  color: var(--color-rule);
  cursor: not-allowed;
}

.count {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-ink-3);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add components/dashboard/
git commit -m "feat: add DashboardPanel, StatWidget, Pager framework primitives"
```

---

## Task 6: DashboardShell

**Files:**
- Create: `components/dashboard/DashboardShell.tsx`
- Create: `components/dashboard/DashboardShell.module.css`

- [ ] **Create `components/dashboard/DashboardShell.tsx`**

```tsx
'use client'

import { useState } from 'react'
import styles from './DashboardShell.module.css'

type Tab = { label: string; key: string }

type Props = {
  tabs: Tab[]
  defaultTab?: string
  children: (activeTab: string) => React.ReactNode
}

export default function DashboardShell({ tabs, defaultTab, children }: Props) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key ?? '')

  return (
    <div className={styles.shell}>
      <nav className={styles.tabBar} aria-label="Dashboard sections">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={[styles.tab, active === tab.key ? styles.tabActive : ''].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className={styles.content}>
        {children(active)}
      </div>
    </div>
  )
}
```

- [ ] **Create `components/dashboard/DashboardShell.module.css`**

```css
.shell {
  width: 100%;
}

.tabBar {
  display: flex;
  gap: 0;
  border-bottom: var(--rule-hairline) solid var(--color-rule);
  margin-bottom: var(--space-6);
}

.tab {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
  background: none;
  border: none;
  border-bottom: var(--rule-medium) solid transparent;
  padding: var(--space-3) var(--space-4);
  margin-bottom: -1px;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out);
}

.tab:hover {
  color: var(--color-ink-2);
}

.tabActive {
  color: var(--color-ink);
  border-bottom-color: var(--color-accent);
}

.content {
  width: 100%;
}
```

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add components/dashboard/DashboardShell.tsx components/dashboard/DashboardShell.module.css
git commit -m "feat: add DashboardShell tab navigation framework component"
```

---

## Task 7: ChartWrapper

**Files:**
- Create: `components/dashboard/ChartWrapper.tsx`
- Create: `components/dashboard/ChartWrapper.module.css`

- [ ] **Create `components/dashboard/ChartWrapper.tsx`**

This standardizes the Recharts `ResponsiveContainer` and provides an empty state. All child Recharts components must use CSS variable values for colors (pass them as inline values using `getComputedStyle`).

```tsx
import { ResponsiveContainer } from 'recharts'
import styles from './ChartWrapper.module.css'

type Props = {
  height?: number
  isEmpty?: boolean
  emptyMessage?: string
  children: React.ReactNode
}

export default function ChartWrapper({
  height = 200,
  isEmpty = false,
  emptyMessage = 'No data in this range',
  children,
}: Props) {
  if (isEmpty) {
    return (
      <div className={styles.empty} style={{ height }}>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Create `components/dashboard/ChartWrapper.module.css`**

```css
.wrapper {
  width: 100%;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-paper-2);
  border: var(--rule-hairline) solid var(--color-rule-soft);
}

.emptyText {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
}
```

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add components/dashboard/ChartWrapper.tsx components/dashboard/ChartWrapper.module.css
git commit -m "feat: add ChartWrapper framework component for Recharts standardization"
```

---

## Task 8: TimeRangeSelector

**Files:**
- Create: `components/dashboard/TimeRangeSelector.tsx`
- Create: `components/dashboard/TimeRangeSelector.module.css`

- [ ] **Create `components/dashboard/TimeRangeSelector.tsx`**

```tsx
import styles from './TimeRangeSelector.module.css'

type Option = { label: string; value: string }

type Props = {
  options: Option[]
  value: string
  onChange: (value: string) => void
}

export default function TimeRangeSelector({ options, value, onChange }: Props) {
  return (
    <div className={styles.group} role="group" aria-label="Time range">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={[styles.btn, value === opt.value ? styles.active : ''].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Create `components/dashboard/TimeRangeSelector.module.css`**

```css
.group {
  display: inline-flex;
  gap: 0;
  border: var(--rule-hairline) solid var(--color-rule);
}

.btn {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
  background: var(--color-paper-2);
  border: none;
  border-right: var(--rule-hairline) solid var(--color-rule);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out),
              background var(--duration-fast) var(--ease-out);
}

.btn:last-child {
  border-right: none;
}

.btn:hover {
  color: var(--color-ink-2);
  background: var(--color-paper);
}

.active {
  background: var(--color-ink);
  color: var(--color-paper);
}

.active:hover {
  background: var(--color-ink);
  color: var(--color-paper);
}
```

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add components/dashboard/TimeRangeSelector.tsx components/dashboard/TimeRangeSelector.module.css
git commit -m "feat: add TimeRangeSelector framework component"
```

---

## Task 9: PasswordGate

**Files:**
- Create: `components/dashboard/PasswordGate.tsx`
- Create: `components/dashboard/PasswordGate.module.css`

The password is validated server-side via the `verifyLiftPassword` server action already in `app/dashboards/gym/actions.ts`. Auth is stored in sessionStorage so the gate doesn't re-prompt on tab switch.

- [ ] **Create `components/dashboard/PasswordGate.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { verifyLiftPassword } from '@/app/dashboards/gym/actions'
import styles from './PasswordGate.module.css'

type Props = {
  children: React.ReactNode
  storageKey?: string
}

export default function PasswordGate({ children, storageKey = 'gym-gate' }: Props) {
  const [authed, setAuthed] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey) === '1') {
      setAuthed(true)
    }
  }, [storageKey])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const ok = await verifyLiftPassword(input)
    setLoading(false)
    if (ok) {
      sessionStorage.setItem(storageKey, '1')
      setAuthed(true)
    } else {
      setError('Incorrect password.')
      setInput('')
    }
  }

  if (authed) return <>{children}</>

  return (
    <div className={styles.gate}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <p className={styles.label}>Password required</p>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={styles.input}
          placeholder="Enter password"
          autoComplete="current-password"
          disabled={loading}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={loading || !input}>
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Create `components/dashboard/PasswordGate.module.css`**

```css
.gate {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-9) var(--gutter);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  max-width: 320px;
}

.label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
}

.input {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-ink);
  background: var(--color-paper-2);
  border: var(--rule-hairline) solid var(--color-rule);
  padding: var(--space-3) var(--space-4);
  width: 100%;
  outline: none;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.input:focus {
  border-color: var(--color-ink-2);
}

.error {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-accent);
}

.submit {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-paper);
  background: var(--color-ink);
  border: none;
  padding: var(--space-3) var(--space-5);
  cursor: pointer;
  align-self: flex-start;
  transition: background var(--duration-fast) var(--ease-out);
}

.submit:hover:not(:disabled) {
  background: var(--color-ink-2);
}

.submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add components/dashboard/PasswordGate.tsx components/dashboard/PasswordGate.module.css
git commit -m "feat: add PasswordGate framework component with server action validation"
```

---

## Task 10: Gym page scaffolding and DashboardCard entry

**Files:**
- Create: `app/dashboards/gym/page.tsx`
- Create: `app/dashboards/gym/GymDashboard.tsx`
- Create: `app/dashboards/gym/GymDashboard.module.css`
- Modify: `app/dashboards/page.tsx`

This task creates the page skeleton. `GymDashboard` will be filled in by later tasks — for now it renders a placeholder so the build passes.

- [ ] **Create `app/dashboards/gym/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
import { getGymLifts } from './actions'
import GymDashboard from './GymDashboard'

export const metadata: Metadata = {
  title: 'Gym Tracker',
  description: 'Personal training log, volume analytics, and AI coaching.',
}

export const dynamic = 'force-dynamic'

export default async function GymTrackerPage() {
  const lifts = await getGymLifts()

  return (
    <div className="page-wrapper--wide">
      <PageHeader
        eyebrow="Dashboards"
        title="Gym Tracker"
        lead="Personal training log, volume analytics, and AI coaching."
        rule={false}
      />
      <GymDashboard lifts={lifts} />
    </div>
  )
}
```

- [ ] **Create `app/dashboards/gym/GymDashboard.tsx`** (skeleton — filled out in later tasks)

```tsx
'use client'

import type { GymLift } from './actions'
import DashboardShell from '@/components/dashboard/DashboardShell'
import styles from './GymDashboard.module.css'

type Props = { lifts: GymLift[] }

const TABS = [
  { label: 'Dashboard', key: 'dashboard' },
  { label: 'Log Workout', key: 'log' },
]

export default function GymDashboard({ lifts }: Props) {
  return (
    <DashboardShell tabs={TABS} defaultTab="dashboard">
      {(active) => (
        <div className={styles.root}>
          {active === 'dashboard' && (
            <p style={{ color: 'var(--color-ink-3)', fontSize: 'var(--text-sm)' }}>
              Dashboard — {lifts.length} lifts loaded
            </p>
          )}
          {active === 'log' && (
            <p style={{ color: 'var(--color-ink-3)', fontSize: 'var(--text-sm)' }}>
              Log Workout — coming soon
            </p>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
```

- [ ] **Create `app/dashboards/gym/GymDashboard.module.css`**

```css
.root {
  position: relative;
}
```

- [ ] **Add gym DashboardCard to `app/dashboards/page.tsx`**

Open `app/dashboards/page.tsx`. Add the gym dashboard to the `dashboards` array:

```ts
const dashboards = [
  {
    tool: 'Next.js + PostgreSQL',
    title: 'Gym Tracker',
    description: 'Personal training log with volume analytics, split tracking, exercise PRs, and an AI coaching assistant.',
    href: '/dashboards/gym',
  },
  {
    tool: 'Tableau',
    title: 'ALS Patient Outcomes',
    description: 'Tracks patient progression metrics and outcome distributions across clinical trial cohorts.',
    href: '/dashboards/coming-soon',
  },
]
```

- [ ] **Verify build and run dev server to confirm page loads**

```bash
npm run build
npm run dev
```

Open `http://localhost:3000/dashboards/gym` — should show the page header, two tabs, and the placeholder text. Open `http://localhost:3000/dashboards` — should show two DashboardCards.

Stop dev server.

- [ ] **Commit**

```bash
git add app/dashboards/gym/ app/dashboards/page.tsx
git commit -m "feat: scaffold gym dashboard page and add DashboardCard entry"
```

---

## Task 11: VolumeChart panel

**Files:**
- Create: `app/dashboards/gym/panels/VolumeChart.tsx`
- Create: `app/dashboards/gym/panels/VolumeChart.module.css`

Source reference: `/Users/dillon/Desktop/projects/dillon-shearer-website/app/demos/gym-dashboard/ui/VolumeChart.tsx`

Read the source file in full before starting. Port all chart logic verbatim. Replace every Tailwind class and hardcoded color with portfolio tokens.

- [ ] **Create `app/dashboards/gym/panels/VolumeChart.tsx`**

Copy the source `VolumeChart.tsx` to `app/dashboards/gym/panels/VolumeChart.tsx`. Apply these changes:

1. Remove all `className="..."` Tailwind strings from JSX
2. Replace the Recharts color props:
   - Bar/Area `fill`: use `"var(--chart-primary)"` for bars, `"var(--chart-secondary)"` for secondary
   - `stroke` on lines: `"var(--chart-primary)"`
   - `CartesianGrid` stroke: `"var(--color-rule-soft)"`
   - `XAxis`/`YAxis` tick style: `{ fill: 'var(--color-ink-3)', fontSize: 12, fontFamily: 'var(--font-sans)' }`
   - Tooltip `contentStyle`: `{ background: 'var(--color-paper)', border: '1px solid var(--color-rule)', borderRadius: '2px', fontFamily: 'var(--font-sans)', fontSize: '12px' }`
3. Wrap the chart in `ChartWrapper` from `@/components/dashboard/ChartWrapper`
4. The component signature should remain: `({ data, height }: { data: { date: string; volume: number }[]; height?: number })`

- [ ] **Create `app/dashboards/gym/panels/VolumeChart.module.css`**

```css
.container {
  width: 100%;
}
```

(Most styling comes from `ChartWrapper`. Add only panel-specific styles here if needed.)

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add app/dashboards/gym/panels/VolumeChart.tsx app/dashboards/gym/panels/VolumeChart.module.css
git commit -m "feat: add VolumeChart panel with portfolio theme"
```

---

## Task 12: SplitFrequency and BodyPartFrequency panels

**Files:**
- Create: `app/dashboards/gym/panels/SplitFrequency.tsx` + `.module.css`
- Create: `app/dashboards/gym/panels/BodyPartFrequency.tsx` + `.module.css`

Source reference: split and body-part sections are inline in `DashboardClient.tsx` (lines ~718–760). Extract them into these standalone components.

- [ ] **Create `app/dashboards/gym/panels/SplitFrequency.tsx`**

```tsx
import styles from './SplitFrequency.module.css'

type Props = {
  push: number
  pull: number
  legs: number
}

const SPLITS = [
  { key: 'push', label: 'Push', colorClass: 'push' },
  { key: 'pull', label: 'Pull', colorClass: 'pull' },
  { key: 'legs', label: 'Legs', colorClass: 'legs' },
] as const

export default function SplitFrequency({ push, pull, legs }: Props) {
  const counts = { push, pull, legs }
  return (
    <div className={styles.grid}>
      {SPLITS.map(({ key, label, colorClass }) => (
        <div key={key} className={[styles.tile, styles[colorClass]].join(' ')}>
          <p className={styles.label}>{label}</p>
          <p className={styles.count}>{counts[key]}</p>
          <p className={styles.unit}>days</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Create `app/dashboards/gym/panels/SplitFrequency.module.css`**

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.tile {
  border-top: var(--rule-medium) solid var(--color-rule);
  padding: var(--space-3) 0;
}

.push { border-top-color: var(--color-accent); }
.pull { border-top-color: var(--color-ink-2); }
.legs { border-top-color: var(--color-rule); }

.label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
  margin-bottom: var(--space-2);
}

.count {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: 400;
  color: var(--color-ink);
  line-height: var(--leading-tight);
  font-variant-numeric: tabular-nums;
}

.unit {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
  margin-top: var(--space-1);
}
```

- [ ] **Create `app/dashboards/gym/panels/BodyPartFrequency.tsx`**

```tsx
import Pager from '@/components/dashboard/Pager'
import styles from './BodyPartFrequency.module.css'

type BodyPartRow = { bp: string; sets: number }

type Props = {
  rows: BodyPartRow[]
  page: number
  totalPages: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export default function BodyPartFrequency({ rows, page, totalPages, total, onPrev, onNext }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.total}>{total} groups</span>
      </div>
      {rows.length === 0 ? (
        <p className={styles.empty}>No sets in this range</p>
      ) : (
        <div className={styles.chips}>
          {rows.map(({ bp, sets }) => (
            <div key={bp} className={styles.chip}>
              <span className={styles.chipLabel}>{bp.charAt(0).toUpperCase() + bp.slice(1)}</span>
              <span className={styles.chipCount}>{sets}</span>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <Pager page={page} totalPages={totalPages} onPrev={onPrev} onNext={onNext} />
      )}
    </div>
  )
}
```

- [ ] **Create `app/dashboards/gym/panels/BodyPartFrequency.module.css`**

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: 100%;
}

.header {
  display: flex;
  justify-content: flex-end;
}

.total {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-ink-3);
  font-variant-numeric: tabular-nums;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  flex: 1;
  align-content: flex-start;
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  border: var(--rule-hairline) solid var(--color-rule);
  padding: var(--space-1) var(--space-3);
}

.chipLabel {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-ink-2);
}

.chipCount {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-ink-3);
  font-variant-numeric: tabular-nums;
}

.empty {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-ink-3);
}
```

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add app/dashboards/gym/panels/SplitFrequency.tsx app/dashboards/gym/panels/SplitFrequency.module.css app/dashboards/gym/panels/BodyPartFrequency.tsx app/dashboards/gym/panels/BodyPartFrequency.module.css
git commit -m "feat: add SplitFrequency and BodyPartFrequency panels"
```

---

## Task 13: BodyDiagram panel

**Files:**
- Create: `app/dashboards/gym/panels/BodyDiagram.tsx`
- Create: `app/dashboards/gym/panels/BodyDiagram.module.css`

Source reference: `/Users/dillon/Desktop/projects/dillon-shearer-website/app/demos/gym-dashboard/ui/BodyDiagram.tsx`

This uses Three.js/React Three Fiber and must be dynamically imported with `ssr: false`. Read the source in full before starting.

- [ ] **Create `app/dashboards/gym/panels/BodyDiagram.tsx`**

Copy source `BodyDiagram.tsx` to `app/dashboards/gym/panels/BodyDiagram.tsx`. Apply these changes:

1. The source file exports both a `BodyPart` type and a default component. Keep both.
2. Remove all Tailwind classes. The component receives `className` and `stats` props — keep those.
3. Replace the source's hardcoded Three.js material colors with portfolio-token-derived values. The muscle highlight colors come from the `--chart-bp-*` CSS variables. Since Three.js materials need hex values (not CSS variables), read them at runtime using:
   ```ts
   const getToken = (varName: string) =>
     getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
   ```
   Use this inside a `useEffect` or `useMemo` on the client side to resolve colors like `--chart-bp-chest` → hex value for the Three.js material.
4. The `naColor` (resting/not-highlighted muscle color) should resolve from `--color-rule-soft` the same way.
5. Keep the existing `stats` and `splitCounts` prop interfaces identical.

- [ ] **Create the dynamic export wrapper** at `app/dashboards/gym/panels/BodyDiagramClient.tsx`

Because `BodyDiagram.tsx` uses Three.js it must not be server-rendered. Create a thin wrapper:

```tsx
'use client'

import dynamic from 'next/dynamic'
import type { BodyPart } from './BodyDiagram'

const BodyDiagramInner = dynamic(() => import('./BodyDiagram'), { ssr: false })

type Props = {
  stats: Record<BodyPart, { volume: number; sets: number }>
  splitCounts: { Push: number; Pull: number; Legs: number }
  className?: string
}

export default function BodyDiagramClient(props: Props) {
  return <BodyDiagramInner {...props} />
}
```

Import `BodyDiagramClient` (not `BodyDiagram` directly) in `GymDashboard.tsx`.

- [ ] **Create `app/dashboards/gym/panels/BodyDiagram.module.css`**

```css
.container {
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: var(--color-paper-2);
  border: var(--rule-hairline) solid var(--color-rule-soft);
}
```

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add app/dashboards/gym/panels/BodyDiagram.tsx app/dashboards/gym/panels/BodyDiagram.module.css app/dashboards/gym/panels/BodyDiagramClient.tsx
git commit -m "feat: add BodyDiagram panel with Three.js, SSR-safe dynamic import"
```

---

## Task 14: ExercisePRsTable panel

**Files:**
- Create: `app/dashboards/gym/panels/ExercisePRsTable.tsx`
- Create: `app/dashboards/gym/panels/ExercisePRsTable.module.css`

Source reference: Exercise PRs table section in `DashboardClient.tsx` (lines ~776–829).

- [ ] **Create `app/dashboards/gym/panels/ExercisePRsTable.tsx`**

Extract the PRs table from `DashboardClient.tsx`. The component accepts pre-computed `rows`, sort state, and callbacks — it does not compute PRs itself (that stays in `GymDashboard.tsx`).

```tsx
import Pager from '@/components/dashboard/Pager'
import styles from './ExercisePRsTable.module.css'

type SortKey = 'exercise' | 'bestWeight' | 'best1RM' | 'bestSetDate'

type PRRow = {
  exercise: string
  bestWeight: number
  best1RM: number
  bestSetDate: string
  bestSet?: { weight: number; reps: number } | null
}

type Props = {
  rows: PRRow[]
  page: number
  totalPages: number
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (key: SortKey) => void
  onPrev: () => void
  onNext: () => void
}

function SortIndicator({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return null
  return <span>{dir === 'asc' ? ' ↑' : ' ↓'}</span>
}

export default function ExercisePRsTable({ rows, page, totalPages, sortKey, sortDir, onSort, onPrev, onNext }: Props) {
  const col = (key: SortKey, label: string) => (
    <th className={styles.th} onClick={() => onSort(key)} style={{ cursor: 'pointer' }}>
      {label}<SortIndicator active={sortKey === key} dir={sortDir} />
    </th>
  )

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {col('exercise', 'Exercise')}
              {col('bestWeight', 'Weight')}
              {col('best1RM', 'Est 1RM')}
              <th className={styles.th}>Best Set</th>
              {col('bestSetDate', 'Date')}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.exercise} className={i < rows.length - 1 ? styles.row : styles.rowLast}>
                <td className={styles.td}>{row.exercise}</td>
                <td className={[styles.td, styles.num].join(' ')}>{row.bestWeight} lbs</td>
                <td className={[styles.td, styles.num, styles.accent].join(' ')}>{row.best1RM} lbs</td>
                <td className={[styles.td, styles.num, styles.muted].join(' ')}>
                  {row.bestSet ? `${row.bestSet.weight} × ${row.bestSet.reps}` : '—'}
                </td>
                <td className={[styles.td, styles.num, styles.muted, styles.dateCell].join(' ')}>
                  {row.bestSetDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} totalPages={totalPages} onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
```

- [ ] **Create `app/dashboards/gym/panels/ExercisePRsTable.module.css`**

```css
.container {
  width: 100%;
}

.tableWrapper {
  overflow-x: auto;
  margin: 0 calc(-1 * var(--space-5));
  padding: 0 var(--space-5);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
}

.th {
  text-align: left;
  padding: var(--space-2) var(--space-3) var(--space-2) 0;
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
  border-bottom: var(--rule-hairline) solid var(--color-rule-soft);
  white-space: nowrap;
  user-select: none;
}

.th:hover {
  color: var(--color-ink-2);
}

.row {
  border-bottom: var(--rule-hairline) solid var(--color-rule-soft);
}

.rowLast {}

.td {
  padding: var(--space-2) var(--space-3) var(--space-2) 0;
  color: var(--color-ink);
  white-space: nowrap;
}

.num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.accent {
  color: var(--color-accent);
}

.muted {
  color: var(--color-ink-3);
}

.dateCell {
  font-size: calc(var(--text-xs) * 0.95);
}
```

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add app/dashboards/gym/panels/ExercisePRsTable.tsx app/dashboards/gym/panels/ExercisePRsTable.module.css
git commit -m "feat: add ExercisePRsTable panel with sort and pagination"
```

---

## Task 15: VolumeHeatmap panel

**Files:**
- Create: `app/dashboards/gym/panels/VolumeHeatmap.tsx`
- Create: `app/dashboards/gym/panels/VolumeHeatmap.module.css`

Source reference: `/Users/dillon/Desktop/projects/dillon-shearer-website/app/demos/gym-dashboard/ui/Heatmap.tsx`

The Heatmap component already has `fillParent` and `autoGrow` props. The key changes are swapping the color scale from green/red to oxblood/ink-tone, and changing `naColor` from the dark `#3b4351` to the portfolio's empty color.

- [ ] **Copy and adapt the Heatmap component**

```bash
cp /Users/dillon/Desktop/projects/dillon-shearer-website/app/demos/gym-dashboard/ui/Heatmap.tsx app/dashboards/gym/panels/VolumeHeatmap.tsx
```

Open `app/dashboards/gym/panels/VolumeHeatmap.tsx` and apply these changes:

1. Rename the function from `Heatmap` to `VolumeHeatmap` and add `export default`.
2. Change the color interpolation. Find the section that computes cell colors (likely uses `highIsGreen` to pick between green and red scales). Replace the color logic with a single portfolio scale:
   - Empty/no data: `#EBE3D5` (rule-soft)
   - Low volume: `#D8CFC2` (rule)
   - Medium: `#4A4239` (ink-2)
   - High: `#7A2E2E` (accent/oxblood)
   
   Replace the existing `interpolateColor` or similar function so it linearly interpolates across `['#EBE3D5', '#D8CFC2', '#4A4239', '#7A2E2E']` based on normalized volume (0–1).

3. Change the default `naColor` prop default from `'#3b4351'` to `'#EBE3D5'`.
4. Remove `highIsGreen` prop entirely (no longer needed — we always use the portfolio scale).
5. Remove all Tailwind classes from any wrapper divs inside the component.

- [ ] **Create `app/dashboards/gym/panels/VolumeHeatmap.module.css`**

```css
.wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 160px;
}

.legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-3);
}

.legendLabel {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
}

.legendScale {
  display: flex;
  gap: var(--space-1);
  align-items: center;
}

.legendSwatch {
  width: 10px;
  height: 10px;
}
```

- [ ] **Create `app/dashboards/gym/panels/VolumeHeatmapWrapper.tsx`** — thin wrapper that adds the legend and applies the module CSS around the raw SVG component

```tsx
import VolumeHeatmapInner from './VolumeHeatmap'
import styles from './VolumeHeatmap.module.css'

type Mode = 'week' | 'month' | 'year'
type Props = {
  mode: Mode
  data: { date: string; volume: number }[]
}

const LEGEND = [
  { color: '#EBE3D5', label: 'None' },
  { color: '#D8CFC2', label: '' },
  { color: '#4A4239', label: '' },
  { color: '#7A2E2E', label: 'High' },
]

export default function VolumeHeatmap({ mode, data }: Props) {
  return (
    <div className={styles.wrapper}>
      <VolumeHeatmapInner
        mode={mode}
        data={data}
        fillParent
        naColor="#EBE3D5"
      />
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        <div className={styles.legendScale}>
          {LEGEND.map(({ color }) => (
            <div key={color} className={styles.legendSwatch} style={{ background: color }} />
          ))}
        </div>
        <span className={styles.legendLabel}>More</span>
      </div>
    </div>
  )
}
```

Use `VolumeHeatmap` (the wrapper) in `GymDashboard.tsx`.

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add app/dashboards/gym/panels/VolumeHeatmap.tsx app/dashboards/gym/panels/VolumeHeatmap.module.css app/dashboards/gym/panels/VolumeHeatmapWrapper.tsx
git commit -m "feat: add VolumeHeatmap panel with portfolio color scale"
```

---

## Task 16: RecentSessions panel

**Files:**
- Create: `app/dashboards/gym/panels/RecentSessions.tsx`
- Create: `app/dashboards/gym/panels/RecentSessions.module.css`

Source reference: Recent sessions section in `DashboardClient.tsx` (lines ~847–904).

- [ ] **Create `app/dashboards/gym/panels/RecentSessions.tsx`**

Extract the recent sessions grid from `DashboardClient.tsx`. The component receives pre-computed session rows and a `onJumpToDay` callback.

```tsx
import Pager from '@/components/dashboard/Pager'
import styles from './RecentSessions.module.css'

type Session = {
  date: string
  volume: number
  exercises: string[]
  sets: number
  dayTag: string | null
}

type Props = {
  rows: Session[]
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  onJumpToDay: (date: string) => void
}

function formatLongDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function titleCaseTag(tag: string) {
  return tag.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

export default function RecentSessions({ rows, page, totalPages, onPrev, onNext, onJumpToDay }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Pager page={page} totalPages={totalPages} onPrev={onPrev} onNext={onNext} />
      </div>
      <div className={styles.grid}>
        {rows.map((s) => (
          <button
            key={s.date}
            type="button"
            onClick={() => onJumpToDay(s.date)}
            className={styles.card}
            aria-label={`View ${formatLongDate(s.date)}`}
            title="Click to view day breakdown"
          >
            <p className={styles.date}>{formatLongDate(s.date)}</p>
            {s.dayTag && (
              <p className={styles.tag}>{titleCaseTag(s.dayTag)}</p>
            )}
            <p className={styles.meta}>
              {s.exercises.length} ex · {s.sets} sets · {s.volume.toLocaleString()} lbs
            </p>
          </button>
        ))}
      </div>
      <p className={styles.hint}>Click any session to view day breakdown</p>
    </div>
  )
}
```

- [ ] **Create `app/dashboards/gym/panels/RecentSessions.module.css`**

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.header {
  display: flex;
  justify-content: flex-end;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.card {
  text-align: left;
  background: none;
  border: none;
  border-top: var(--rule-hairline) solid var(--color-rule);
  border-bottom: var(--rule-hairline) solid var(--color-rule-soft);
  padding: var(--space-4) 0;
  cursor: pointer;
  width: 100%;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.card:hover {
  border-top-color: var(--color-ink-2);
}

.date {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--color-ink);
  margin-bottom: var(--space-1);
}

.tag {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: var(--space-3);
}

.meta {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-ink-3);
  font-variant-numeric: tabular-nums;
}

.hint {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-ink-3);
  font-style: italic;
}
```

- [ ] **Verify build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add app/dashboards/gym/panels/RecentSessions.tsx app/dashboards/gym/panels/RecentSessions.module.css
git commit -m "feat: add RecentSessions panel with paginated session cards"
```

---

## Task 17: Assemble aggregate view in GymDashboard

**Files:**
- Modify: `app/dashboards/gym/GymDashboard.tsx`
- Modify: `app/dashboards/gym/GymDashboard.module.css`

This task wires all the aggregate panels into `GymDashboard.tsx`. Port all data transformation logic from `DashboardClient.tsx` verbatim (the `useMemo` computations for `filtered`, `daily`, `totalVolume`, `splitCountsPPL`, `bodyStats`, `bodyPartsList`, `prsAll`, `recentSessionsAll`, etc.). Only the JSX and styles change.

- [ ] **Replace `GymDashboard.tsx` with the full implementation**

Read `DashboardClient.tsx` from the source in full. Port all `useMemo`/`useState`/`useCallback` logic verbatim. The JSX structure follows the spec layout:

```
DashboardShell (tabs: Dashboard | Log Workout)
  Dashboard tab:
    <div className={styles.controls}>
      <TimeRangeSelector ... />
      <DateNavigation ... />   {/* prev/next arrows for day/year mode */}
      <DownloadButton ... />
    </div>

    {mode === 'day' ? (
      <DailyView lifts={lifts} date={dayDate} onChangeDate={...} />
    ) : (
      <>
        {/* KPI row */}
        <div className={styles.kpiRow}>
          <StatWidget label="Total Volume" value={totalVolume} sub="lbs" />
          <StatWidget label="Gym Days" value={`${gymDays} / ${dateWindow.length}`} />
          <StatWidget label="Exercise Variety" value={exerciseVariety} />
        </div>

        {/* Volume chart + Body Diagram */}
        <div className={styles.mainGrid}>
          <div className={styles.leftCol}>
            <DashboardPanel eyebrow="Daily Volume">
              <VolumeChart data={daily.map(...)} height={200} />
            </DashboardPanel>
            <div className={styles.splitRow}>
              <DashboardPanel eyebrow="Split Frequency">
                <SplitFrequency push={...} pull={...} legs={...} />
              </DashboardPanel>
              <DashboardPanel eyebrow="Body Part Frequency">
                <BodyPartFrequency rows={bodyPartsPaged.rows} ... />
              </DashboardPanel>
            </div>
          </div>
          <div className={styles.sidebar}>
            <DashboardPanel eyebrow="Muscles Trained">
              <BodyDiagramClient stats={bodyStats} splitCounts={splitCountsPPL} />
            </DashboardPanel>
          </div>
        </div>

        {/* PRs + Heatmap */}
        <div className={styles.twoCol}>
          <DashboardPanel eyebrow="Exercise PRs">
            <ExercisePRsTable rows={prsSortedPaged.rows} ... />
          </DashboardPanel>
          <DashboardPanel eyebrow="Volume Heatmap">
            <VolumeHeatmap mode={mode as 'week'|'month'|'year'} data={daily.map(...)} />
          </DashboardPanel>
        </div>

        {/* Recent Sessions */}
        <DashboardPanel eyebrow="Recent Sessions">
          <RecentSessions rows={recentSessions.rows} ... onJumpToDay={jumpToDay} />
        </DashboardPanel>
      </>
    )}

  Log Workout tab:
    <PasswordGate>
      <WorkoutForm />   {/* placeholder until Task 22 */}
    </PasswordGate>
```

- [ ] **Update `GymDashboard.module.css`**

```css
.root {
  position: relative;
}

.controls {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
}

.kpiRow {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin-bottom: var(--space-3);
  border-right: var(--rule-hairline) solid var(--color-rule);
}

.kpiRow > * {
  border-right: none;
  padding-right: var(--space-5);
}

.kpiRow > * + * {
  padding-left: var(--space-5);
  border-left: var(--rule-hairline) solid var(--color-rule);
}

@media (max-width: 720px) {
  .kpiRow {
    grid-template-columns: 1fr;
    border-right: none;
  }
  .kpiRow > * + * {
    border-left: none;
    padding-left: 0;
  }
}

.mainGrid {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: var(--space-5);
  align-items: start;
}

@media (max-width: 1080px) {
  .mainGrid {
    grid-template-columns: 1fr;
  }
}

.leftCol {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.splitRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
}

@media (max-width: 720px) {
  .splitRow {
    grid-template-columns: 1fr;
  }
}

.sidebar {
  position: sticky;
  top: var(--space-5);
}

.twoCol {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
}

@media (max-width: 720px) {
  .twoCol {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Verify build and run dev server**

```bash
npm run build
npm run dev
```

Open `http://localhost:3000/dashboards/gym`. Verify: tabs render, time range selector works, KPI stats show, all panels render with real data from the database. Stop dev server.

- [ ] **Commit**

```bash
git add app/dashboards/gym/GymDashboard.tsx app/dashboards/gym/GymDashboard.module.css
git commit -m "feat: assemble gym dashboard aggregate view with all panels"
```

---

## Task 18: DailyView

**Files:**
- Create: `app/dashboards/gym/panels/DailyView/index.tsx` + `index.module.css`
- Create: `app/dashboards/gym/panels/DailyView/SevenDayStrip.tsx` + `.module.css`
- Create: `app/dashboards/gym/panels/DailyView/CumulativeVolumeChart.tsx` + `.module.css`
- Create: `app/dashboards/gym/panels/DailyView/MuscleVolumeDonut.tsx` + `.module.css`
- Create: `app/dashboards/gym/panels/DailyView/ExerciseTable.tsx` + `.module.css`

Source reference: `/Users/dillon/Desktop/projects/dillon-shearer-website/app/demos/gym-dashboard/ui/DailyView.tsx`

Read the source in full. Port all logic verbatim. The DailyView has 4 sub-sections: 7-day strip, 4 KPI stats, two charts (cumulative area + donut), and the exercise set table.

- [ ] **Create `SevenDayStrip.tsx`**

Extract the last-7-days navigation from source `DailyView.tsx` (the `last7` useMemo + button grid). Props: `{ lifts: GymLift[], date: string, onChangeDate: (d: string) => void }`. 

Replace Tailwind classes:
- Active day: `background: var(--color-accent); color: var(--color-paper); border-color: var(--color-accent)`
- Day with data: `border-color: var(--color-rule); color: var(--color-ink-2)`
- Day without data: `border-color: var(--color-rule-soft); color: var(--color-ink-3)`

Create matching `.module.css` with those styles plus a flex/grid layout for the 7 buttons. Mobile: horizontally scrollable with `overflow-x: auto`.

- [ ] **Create `CumulativeVolumeChart.tsx`**

Extract the cumulative area chart from source. Port the `bpStops` gradient logic verbatim. Replace body part colors with `var(--chart-bp-*)` CSS variable values resolved via `getComputedStyle(document.documentElement).getPropertyValue('--chart-bp-chest').trim()` etc. Wrap in `ChartWrapper`.

- [ ] **Create `MuscleVolumeDonut.tsx`**

Extract the pie/donut chart from source. Replace color assignments with `--chart-bp-*` values resolved at render time. Wrap in `ChartWrapper`.

- [ ] **Create `ExerciseTable.tsx`**

Extract the exercise breakdown table from source `DailyView.tsx` (grouped by exercise, rows per set). Use portfolio `Table` conventions: hairline borders, `--font-mono` for numerics, `--font-sans` for labels.

- [ ] **Create `DailyView/index.tsx`**

```tsx
import type { GymLift } from '../../actions'
import DashboardPanel from '@/components/dashboard/DashboardPanel'
import StatWidget from '@/components/dashboard/StatWidget'
import SevenDayStrip from './SevenDayStrip'
import CumulativeVolumeChart from './CumulativeVolumeChart'
import MuscleVolumeDonut from './MuscleVolumeDonut'
import ExerciseTable from './ExerciseTable'
import styles from './index.module.css'
// ... (port all KPI useMemo calculations from source DailyView.tsx verbatim)

type Props = {
  lifts: GymLift[]
  date: string
  onChangeDate: (date: string) => void
}

export default function DailyView({ lifts, date, onChangeDate }: Props) {
  // Port all useMemo/useEffect logic from source verbatim
  // ...
  return (
    <div className={styles.root}>
      <DashboardPanel eyebrow="Last 7 days">
        <SevenDayStrip lifts={lifts} date={date} onChangeDate={onChangeDate} />
      </DashboardPanel>
      <div className={styles.kpiRow}>
        <StatWidget label="Total Volume" value={totalVolume} sub="lbs" />
        <StatWidget label="Exercises · Sets · Reps" value={`${exerciseCount} · ${totalSets} · ${totalReps}`} />
        <StatWidget label="Top Body Part" value={topBodyPart} />
        <StatWidget label="Near-Max Sets" value={nearMaxSets} sub="≥ 90% lifetime 1RM" />
      </div>
      <div className={styles.chartRow}>
        <DashboardPanel eyebrow="Cumulative Volume by Body Part" className={styles.chartLarge}>
          <CumulativeVolumeChart dayLifts={dayLifts} />
        </DashboardPanel>
        <DashboardPanel eyebrow="Muscle Volume" className={styles.chartSmall}>
          <MuscleVolumeDonut dayLifts={dayLifts} />
        </DashboardPanel>
      </div>
      <DashboardPanel eyebrow="Sets">
        <ExerciseTable dayLifts={dayLifts} allLifts={lifts} />
      </DashboardPanel>
    </div>
  )
}
```

- [ ] **Create `DailyView/index.module.css`**

```css
.root {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.kpiRow {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  border-top: var(--rule-medium) solid var(--color-ink);
  border-bottom: var(--rule-hairline) solid var(--color-rule);
  margin-bottom: var(--space-3);
}

.kpiRow > * {
  border-top: none;
  border-bottom: none;
  padding-right: var(--space-5);
}

.kpiRow > * + * {
  padding-left: var(--space-5);
  border-left: var(--rule-hairline) solid var(--color-rule);
}

@media (max-width: 720px) {
  .kpiRow {
    grid-template-columns: repeat(2, 1fr);
  }
}

.chartRow {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-5);
}

@media (max-width: 720px) {
  .chartRow {
    grid-template-columns: 1fr;
  }
}

.chartLarge {}
.chartSmall {}
```

- [ ] **Verify build and run dev server**

```bash
npm run build
npm run dev
```

Select "Day" mode. Verify the 7-day strip, 4 KPIs, two charts, and exercise table all render. Stop dev server.

- [ ] **Commit**

```bash
git add app/dashboards/gym/panels/DailyView/
git commit -m "feat: add DailyView with 7-day strip, KPIs, charts, and exercise table"
```

---

## Task 19: FloatingChatWidget

**Files:**
- Create: `components/dashboard/FloatingChatWidget.tsx`
- Create: `components/dashboard/FloatingChatWidget.module.css`

Source reference: Chat bubble + `ChatClient.tsx` from source at `/Users/dillon/Desktop/projects/dillon-shearer-website/app/demos/gym-dashboard/chat/ChatClient.tsx`

Port all chat logic (message state, streaming fetch, markdown rendering, chart rendering, follow-up suggestions, viewport clamping) verbatim. Rebuild the entire JSX/CSS from scratch using portfolio tokens.

- [ ] **Create `components/dashboard/FloatingChatWidget.tsx`**

Read source `ChatClient.tsx` in full. The component structure:

```tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
// Port: react-markdown import, chart-related imports
import styles from './FloatingChatWidget.module.css'

type Props = {
  apiEndpoint: string
}

export default function FloatingChatWidget({ apiEndpoint }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Port viewport clamping logic from DashboardClient.tsx (clampBubble, useEffect for resize)
  // Port all message state and chat fetch logic from ChatClient.tsx
  // Use apiEndpoint prop instead of hardcoded '/api/gym-chat'

  return (
    <div
      ref={bubbleRef}
      className={styles.bubble}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      {isOpen && (
        <div className={styles.panel}>
          {/* Port message list, input, suggestions from ChatClient.tsx */}
          {/* Replace all Tailwind with CSS module classes */}
          {/* Replace all color values with CSS variables */}
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={styles.trigger}
        aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}
```

- [ ] **Create `components/dashboard/FloatingChatWidget.module.css`**

```css
.bubble {
  position: fixed;
  bottom: var(--space-5);
  right: var(--space-5);
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-3);
}

.trigger {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-ink);
  border: var(--rule-hairline) solid var(--color-ink);
  color: var(--color-paper);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

.trigger:hover {
  background: var(--color-ink-2);
  border-color: var(--color-ink-2);
}

.panel {
  width: min(420px, calc(100vw - var(--space-6)));
  max-height: 600px;
  background: var(--color-paper-2);
  border: var(--rule-hairline) solid var(--color-rule);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: var(--rule-hairline) solid var(--color-rule);
}

.panelTitle {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-ink-3);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.message {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--color-ink);
}

.messageUser {
  align-self: flex-end;
  background: var(--color-paper);
  border: var(--rule-hairline) solid var(--color-rule);
  padding: var(--space-2) var(--space-3);
  max-width: 80%;
}

.messageAssistant {
  align-self: flex-start;
  max-width: 100%;
}

.inputRow {
  display: flex;
  gap: 0;
  border-top: var(--rule-hairline) solid var(--color-rule);
}

.input {
  flex: 1;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-ink);
  background: var(--color-paper-2);
  border: none;
  padding: var(--space-3) var(--space-4);
  outline: none;
  resize: none;
}

.sendBtn {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-paper);
  background: var(--color-ink);
  border: none;
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
  white-space: nowrap;
}

.sendBtn:hover:not(:disabled) {
  background: var(--color-ink-2);
}

.sendBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: var(--rule-hairline) solid var(--color-rule-soft);
}

.suggestionBtn {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-ink-2);
  background: var(--color-paper);
  border: var(--rule-hairline) solid var(--color-rule);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.suggestionBtn:hover {
  border-color: var(--color-ink-2);
}
```

- [ ] **Wire FloatingChatWidget into GymDashboard.tsx**

In `GymDashboard.tsx`, add at the bottom of the Dashboard tab content (outside `DashboardShell` children, as a sibling rendered outside the scroll flow):

```tsx
import FloatingChatWidget from '@/components/dashboard/FloatingChatWidget'

// Inside the Dashboard tab content:
<FloatingChatWidget apiEndpoint="/api/gym-chat" />
```

- [ ] **Verify build and run dev server**

```bash
npm run build
npm run dev
```

Open `/dashboards/gym`. Verify the chat button appears bottom-right, clicking opens the panel, and sending a message reaches the API. Stop dev server.

- [ ] **Commit**

```bash
git add components/dashboard/FloatingChatWidget.tsx components/dashboard/FloatingChatWidget.module.css app/dashboards/gym/GymDashboard.tsx
git commit -m "feat: add FloatingChatWidget with speech bubble icon and chat panel"
```

---

## Task 20: WorkoutForm

**Files:**
- Create: `app/dashboards/gym/form/WorkoutForm.tsx` + `.module.css`
- Create: `app/dashboards/gym/form/DayInfoSheet.tsx` + `.module.css`
- Create: `app/dashboards/gym/form/BodyPartsSheet.tsx` + `.module.css`
- Create: `app/dashboards/gym/form/ExerciseManagerModal.tsx` + `.module.css`
- Create: `app/dashboards/gym/form/EditSetModal.tsx` + `.module.css`

Source reference: `/Users/dillon/Desktop/projects/dillon-shearer-website/app/demos/gym-dashboard/form/page.tsx` (1,394 lines)

Read the source form file in full before starting. Port ALL form logic verbatim. The implementing agent has explicit permission to propose and implement UX improvements during the port — look for areas where the form flow, mobile usability, or feedback UX can be improved while keeping the data model and server actions unchanged.

- [ ] **Create `WorkoutForm.tsx`**

Port form/page.tsx into a `WorkoutForm` component (not a page — it's rendered inside the Log Workout tab). The component accepts no props (it uses server actions and internal state). Key structural changes from source:

1. Remove the password gate (handled by `PasswordGate` in `GymDashboard.tsx`)
2. Remove the outer page layout/wrapper divs
3. Replace all Tailwind classes with CSS Module classes
4. Replace all hardcoded colors with `var(--...)` tokens
5. Import server actions from `@/app/dashboards/gym/actions` instead of the old path
6. Import catalog actions from `@/app/dashboards/gym/catalog`

The form fields remain identical: date, workout day, body parts, exercise, equipment, weight, reps, unilateral.

- [ ] **Create form modal components**

Extract the four modal/sheet components from the source form:

- `DayInfoSheet` — date picker + workout day tag selector (sheet/drawer)
- `BodyPartsSheet` — 12 body part multi-select with localStorage caching (sheet/drawer)
- `ExerciseManagerModal` — add/rename/delete exercises (modal)
- `EditSetModal` — edit an existing set's fields (modal)

For each: port logic verbatim, rebuild JSX with CSS Module styles. Sheets should use a slide-up pattern on mobile: `position: fixed; bottom: 0; left: 0; right: 0` with a backdrop. Modals: `position: fixed; inset: 0; display: grid; place-items: center` with a backdrop. No `box-shadow` — use `border-top: var(--rule-medium) solid var(--color-ink)` on sheets.

- [ ] **Wire WorkoutForm into GymDashboard.tsx**

In `GymDashboard.tsx`, replace the Log Workout placeholder with:

```tsx
import PasswordGate from '@/components/dashboard/PasswordGate'
import WorkoutForm from './form/WorkoutForm'

// Log Workout tab:
{active === 'log' && (
  <PasswordGate>
    <WorkoutForm />
  </PasswordGate>
)}
```

- [ ] **Verify build and run dev server**

```bash
npm run build
npm run dev
```

Open `/dashboards/gym`, click "Log Workout" tab. Verify password gate appears, entering the correct password (from `.env.local`) reveals the form. Verify: exercises load from DB, adding a set inserts a row (check the live history updates), edit/delete work. Stop dev server.

- [ ] **Commit**

```bash
git add app/dashboards/gym/form/ app/dashboards/gym/GymDashboard.tsx
git commit -m "feat: add WorkoutForm with password gate and all modals"
```

---

## Task 21: Audit and fix known logic bugs

**Files:**
- Modify: `app/dashboards/gym/GymDashboard.tsx` (or relevant panels)
- Modify: `app/api/gym-data/route.ts`
- Modify: `app/api/gym-data.csv/route.ts` (if applicable)

- [ ] **Fix unilateral volume bug**

The `isUnilateral` field in `gym_lifts` flags single-limb exercises. Currently volume is calculated as `weight × reps` for all sets including unilateral ones.

Investigate the intent: a unilateral set (e.g., single-arm curl at 30 lbs for 10 reps) records one side's work. Total volume for that set could be argued as either 30×10=300 (one side) or 30×10×2=600 (both sides implied). The data model stores one side's data.

Decision to implement (check with user if unclear): treat unilateral sets as informational only — volume calculation stays as `weight × reps` (one side), which is what was recorded. The `isUnilateral` flag is displayed in the exercise table but does not modify volume math. This is the safest interpretation since the DB data is already recorded per-side.

Find every place volume is computed in `GymDashboard.tsx` and the data panels:
```bash
grep -rn "weight.*reps\|reps.*weight" app/dashboards/gym/
```

Add a comment at each calculation site documenting the decision:
```ts
// Volume = weight × reps per set (unilateral sets record one side; no doubling applied)
const volume = l.weight * l.reps
```

- [ ] **Audit download API routes**

Read `app/api/gym-data/route.ts` and `app/api/gym-data.csv/route.ts` in full.

Check for:
1. Does the `from`/`to` date filter correctly use `>=` and `<=` (inclusive) against the `date` column?
2. Does the `exclude` query param correctly strip columns from the JSON/CSV output?
3. Is the response `Content-Disposition` header set for CSV so the browser downloads the file?

Fix any issues found. Then test the download button manually:
```bash
npm run dev
```
Open `/dashboards/gym`, set a date range, click Download, try both CSV and JSON. Verify the downloaded file contains the right rows for the selected range. Stop dev server.

- [ ] **Commit**

```bash
git add app/dashboards/gym/ app/api/gym-data/ "app/api/gym-data.csv/"
git commit -m "fix: document unilateral volume decision, audit and fix download API"
```

---

## Task 22: Final verification and STYLE.md compliance pass

**Files:**
- Any files with STYLE.md violations found during review

- [ ] **Run full build**

```bash
npm run build
```

Expected: zero TypeScript errors, zero Next.js build errors.

- [ ] **STYLE.md compliance audit**

Read `.claude/STYLE.md` in full. Then grep for common violations:

```bash
# Check for hardcoded hex values in new files
grep -rn "#[0-9a-fA-F]\{3,6\}" components/dashboard/ app/dashboards/gym/ --include="*.css" --include="*.tsx"

# Check for box-shadow
grep -rn "box-shadow" components/dashboard/ app/dashboards/gym/ --include="*.css"

# Check for border-radius > 2px
grep -rn "border-radius" components/dashboard/ app/dashboards/gym/ --include="*.css"

# Check for em/en dashes in copy
grep -rn "[–—]" components/dashboard/ app/dashboards/gym/ --include="*.tsx"
```

Fix any violations found.

- [ ] **Run dev server for full walkthrough**

```bash
npm run dev
```

Walk through the complete feature:
1. `/dashboards` — gym DashboardCard visible, link works
2. `/dashboards/gym` — page header correct, two tabs visible
3. Dashboard tab, 7D mode — all panels render with data
4. Dashboard tab, Day mode — 7-day strip, 4 KPIs, charts, exercise table
5. Dashboard tab, YTD mode — volume chart, body diagram, PRs table, heatmap
6. Floating chat button — opens panel, send a question, get a response
7. Log Workout tab — password gate, form loads, can add/edit/delete sets
8. Download — CSV and JSON both download with correct data

Stop dev server.

- [ ] **Commit**

```bash
git add -u
git commit -m "fix: STYLE.md compliance pass on gym dashboard components"
```

---

## Task 23: Update CLAUDE.md and STYLE.md

**Files:**
- Modify: `.claude/STYLE.md`
- Modify: `CLAUDE.md`

- [ ] **Update `.claude/STYLE.md`** to document the new dashboard framework components

Add a `Dashboard Components` section listing `DashboardShell`, `DashboardPanel`, `StatWidget`, `ChartWrapper`, `TimeRangeSelector`, `PasswordGate`, `FloatingChatWidget`, `Pager` — same format as the existing UI primitives section.

- [ ] **Update `CLAUDE.md`** routes table to add `/dashboards/gym`

```markdown
| `/dashboards/gym` | Gym tracker dashboard (analytics, log workout, AI chat) |
```

- [ ] **Commit**

```bash
git add .claude/STYLE.md CLAUDE.md
git commit -m "docs: document dashboard framework components in STYLE.md and CLAUDE.md"
```

---

## Self-Review Checklist (agent: run this before marking complete)

**Spec coverage:**
- [x] Route `/dashboards/gym` with `PageHeader` and wide layout
- [x] DashboardCard on dashboards list page
- [x] Two-tab `DashboardShell` (Dashboard / Log Workout)
- [x] All 8 framework primitives in `components/dashboard/`
- [x] Aggregate view: 3 KPIs, VolumeChart, SplitFrequency, BodyPartFrequency, BodyDiagram, ExercisePRsTable, VolumeHeatmap, RecentSessions
- [x] Day view: 7-day strip, 4 KPIs, CumulativeVolumeChart, MuscleVolumeDonut, ExerciseTable
- [x] Day vs. aggregate mode switching with Back button and prevMode state
- [x] Download modal (CSV/JSON, current filter / all time)
- [x] FloatingChatWidget with speech bubble icon, wired to `/api/gym-chat`
- [x] Chat logic ported verbatim from source ChatClient.tsx
- [x] PasswordGate on Log Workout tab (sessionStorage auth)
- [x] WorkoutForm with all fields identical to source
- [x] All four form modals/sheets (DayInfoSheet, BodyPartsSheet, ExerciseManagerModal, EditSetModal)
- [x] Data layer: lib/gym-chat, API routes, server actions all ported
- [x] DB hard limit documented and respected (no schema changes)
- [x] Unilateral volume decision documented at all calculation sites
- [x] Download API audited and fixed
- [x] Form enhancement latitude granted to implementing agent
- [x] Portfolio tokens only — no raw hex, no Tailwind, no box-shadow, no border-radius > 2px
- [x] Three.js BodyDiagram uses `next/dynamic` with `ssr: false`
- [x] CLAUDE.md and STYLE.md updated
