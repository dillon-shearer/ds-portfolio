# Dashboards Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Dashboards nav item and page listing dashboard cards with thumbnail, tool badge, title, description, and link.

**Architecture:** New `DashboardCard` UI component mirrors the existing `Card` border pattern but uses a flex row layout with a thumbnail placeholder. The page follows the same inline data array + `PageHeader` pattern used by About and Home. One placeholder entry ships; more are added manually over time.

**Tech Stack:** Next.js 15 App Router, TypeScript, CSS Modules, design tokens from `styles/tokens.css`

---

## Files

| Action | Path | Responsibility |
|---|---|---|
| Create | `components/ui/DashboardCard.tsx` | Thumbnail + content card component |
| Create | `components/ui/DashboardCard.module.css` | DashboardCard styles (tokens only) |
| Modify | `components/ui/index.ts` | Export DashboardCard |
| Create | `app/dashboards/page.tsx` | Page with data array and card list |
| Create | `app/dashboards/page.module.css` | Page layout styles |
| Modify | `components/ui/PageHeader.tsx` | Make eyebrow prop optional |
| Modify | `components/Header.tsx` | Add Dashboards to NAV_ITEMS |

---

## Task 1: DashboardCard component

**Files:**
- Create: `components/ui/DashboardCard.tsx`
- Create: `components/ui/DashboardCard.module.css`

- [ ] **Step 1: Create `DashboardCard.module.css`**

```css
/* components/ui/DashboardCard.module.css */
.card {
  border-top: var(--rule-medium) solid var(--color-ink);
  border-bottom: var(--rule-hairline) solid var(--color-rule);
  padding: var(--space-5) 0;
  display: flex;
  gap: var(--space-5);
  align-items: flex-start;
}

.thumb {
  width: 108px;
  flex-shrink: 0;
  aspect-ratio: 4 / 3;
  border: var(--rule-hairline) solid var(--color-rule);
  border-radius: var(--radius-sm);
  background: var(--color-paper-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 28px;
  opacity: 0.3;
}

.bar {
  width: 6px;
  background: var(--color-ink);
  border-radius: 1px 1px 0 0;
}

.content {
  flex: 1;
  min-width: 0;
}

.eyebrow {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-snug);
  color: var(--color-ink-3);
  margin-bottom: var(--space-2);
}

.title {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: 500;
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--color-ink);
  margin-bottom: var(--space-2);
}

.description {
  font-family: var(--font-serif);
  font-size: var(--text-md);
  line-height: var(--leading-loose);
  color: var(--color-ink-2);
  margin-bottom: var(--space-4);
}

@media (max-width: 719px) {
  .card {
    flex-direction: column;
  }

  .thumb {
    width: 100%;
    aspect-ratio: 16 / 9;
  }
}
```

- [ ] **Step 2: Create `DashboardCard.tsx`**

```tsx
// components/ui/DashboardCard.tsx
import { Button } from './Button'
import styles from './DashboardCard.module.css'

interface DashboardCardProps {
  tool: string
  title: string
  description: string
  href: string
}

export function DashboardCard({ tool, title, description, href }: DashboardCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.thumb} aria-hidden="true">
        <div className={styles.chart}>
          <div className={styles.bar} style={{ height: 14 }} />
          <div className={styles.bar} style={{ height: 22 }} />
          <div className={styles.bar} style={{ height: 10 }} />
          <div className={styles.bar} style={{ height: 18 }} />
          <div className={styles.bar} style={{ height: 26 }} />
        </div>
      </div>
      <div className={styles.content}>
        <p className={styles.eyebrow}>{tool}</p>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <Button href={href} variant="outline">View Dashboard</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/DashboardCard.tsx components/ui/DashboardCard.module.css
git commit -m "feat: add DashboardCard component"
```

---

## Task 2: Export DashboardCard from ui/index.ts

**Files:**
- Modify: `components/ui/index.ts`

- [ ] **Step 1: Add export**

Open `components/ui/index.ts` and add this line at the end:

```ts
export { DashboardCard } from './DashboardCard'
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/index.ts
git commit -m "feat: export DashboardCard from ui index"
```

---

## Task 3: Make PageHeader eyebrow optional

**Files:**
- Modify: `components/ui/PageHeader.tsx`

The `eyebrow` prop is currently required and renders unconditionally. The dashboards page has no eyebrow, so it must be made optional.

- [ ] **Step 1: Update `PageHeader.tsx`**

```tsx
// components/ui/PageHeader.tsx
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  lead?: string
}

export function PageHeader({ eyebrow, title, lead }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1 className={styles.title}>{title}</h1>
      {lead && <p className={styles.lead}>{lead}</p>}
      <hr className={styles.rule} />
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/PageHeader.tsx
git commit -m "fix: make PageHeader eyebrow optional"
```

---

## Task 4: Dashboards page

**Files:**  
- Create: `app/dashboards/page.tsx`
- Create: `app/dashboards/page.module.css`

- [ ] **Step 1: Create `page.module.css`**

```css
/* app/dashboards/page.module.css */
.list {
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 2: Create `page.tsx`**

```tsx
// app/dashboards/page.tsx
import type { Metadata } from 'next'
import { PageHeader, DashboardCard } from '@/components/ui'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Dashboards',
  description: 'A collection of data visualizations and analytics dashboards built across tools and domains.',
}

const dashboards = [
  {
    tool: 'Tableau',
    title: 'ALS Patient Outcomes',
    description: 'Tracks patient progression metrics and outcome distributions across clinical trial cohorts.',
    href: '#',
  },
]

export default function DashboardsPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        title="Dashboards"
        lead="A collection of data visualizations and analytics dashboards built across tools and domains."
      />
      <div className={styles.list}>
        {dashboards.map((d) => (
          <DashboardCard
            key={d.title}
            tool={d.tool}
            title={d.title}
            description={d.description}
            href={d.href}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboards/page.tsx app/dashboards/page.module.css
git commit -m "feat: add dashboards page"
```

---

## Task 5: Add Dashboards to header nav

**Files:**
- Modify: `components/Header.tsx`

- [ ] **Step 1: Update NAV_ITEMS**

In `components/Header.tsx`, find:

```ts
const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]
```

Replace with:

```ts
const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/dashboards', label: 'Dashboards' },
  { href: '/contact', label: 'Contact' },
]
```

- [ ] **Step 2: Commit**

```bash
git add components/Header.tsx
git commit -m "feat: add dashboards nav item"
```

---

## Task 6: Build check

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: build completes with no errors. No TypeScript errors, no missing module errors.

- [ ] **Step 2: Smoke test in dev**

```bash
npm run dev
```

Open `http://localhost:3000/dashboards`. Verify:
- "Dashboards" appears in the header nav, active on this page
- Page title reads "Dashboards" with the lead paragraph below
- One dashboard card renders with thumbnail placeholder, "Tableau" eyebrow, title, description, and "View Dashboard" button
- Resize below 720px: thumbnail stacks above content

- [ ] **Step 3: Check PageHeader eyebrow is absent**

The `PageHeader` component renders an eyebrow only when the `eyebrow` prop is passed. The dashboards page passes no `eyebrow` prop, so none should appear. Confirm no eyebrow text renders above the "Dashboards" title.
