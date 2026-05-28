# Dashboards Page Design

**Date:** 2026-05-28
**Status:** Approved

## Overview

Add a Dashboards page and header nav item to the Data With Dillon portfolio site. The page lists data visualization and analytics dashboards with a thumbnail, tool type, title, description, and link. Dashboards are not yet hosted; links and thumbnails are placeholders to be swapped in later.

## Architecture

Follows the existing Next.js App Router pattern used by `/about` and `/contact`:

- `app/dashboards/page.tsx` — page component with inline data array
- `app/dashboards/page.module.css` — page-level layout styles
- `components/ui/DashboardCard.tsx` — new UI component
- `components/ui/DashboardCard.module.css` — component styles using tokens only
- `components/ui/index.ts` — add DashboardCard export
- `components/Header.tsx` — add Dashboards to NAV_ITEMS

No new dependencies. No data files. No CMS.

## Page (`app/dashboards/page.tsx`)

- Uses `PageHeader` with no eyebrow prop, title "Dashboards", lead "A collection of data visualizations and analytics dashboards built across tools and domains."
- Data array `const dashboards = [...]` inline in the file, same pattern as About and Home pages.
- One placeholder entry on initial implementation (tool: Tableau, title: ALS Patient Outcomes).
- More entries added manually as dashboards are published.
- Renders a list of `DashboardCard` components, one per entry.

### Dashboard data shape

```ts
type Dashboard = {
  tool: string       // e.g. "Tableau", "Power BI", "Next.js"
  title: string
  description: string
  href: string       // placeholder "#" until live
}
```

## DashboardCard Component

Layout: thumbnail on left, content on right (flex row).

**Thumbnail:**
- 108px wide, 4:3 aspect ratio
- `border: var(--rule-hairline) solid var(--color-rule)`
- `border-radius: var(--radius-sm)` (2px max)
- `background: var(--color-paper-2)`
- Contains a small inline SVG bar chart placeholder (no external image dependency)
- Placeholder is hardcoded in the component; swap for a real `<img>` when screenshots are available

**Content:**
- Eyebrow: tool type — sans, xs, uppercase, wide tracking, `--color-ink-3`
- Title: serif, xl, weight 500, snug leading, tight tracking, `--color-ink`
- Description: serif, md, loose leading, `--color-ink-2`
- Button: existing `Button` component, `variant="outline"`, label "View Dashboard", `href` from data

**Card border:** matches existing `Card` component pattern:
- `border-top: var(--rule-medium) solid var(--color-ink)`
- `border-bottom: var(--rule-hairline) solid var(--color-rule)`
- Padding: `var(--space-5) 0`

**Responsive:** below 720px, thumbnail stacks above content (flex-direction: column, thumbnail becomes full width).

## Style Constraints

All from STYLE.md:
- No hex/rgb values — tokens only
- No `border-radius` > 2px
- No `box-shadow`
- No gradient backgrounds
- No emoji in nav, headers, or buttons
- No em dashes or en dashes in copy

## Nav

Add `{ href: '/dashboards', label: 'Dashboards' }` to `NAV_ITEMS` in `components/Header.tsx`, between About and Contact.

## Out of Scope

- Filtering or grouping by tool type (add later if needed)
- Real screenshots or embedded iframes (add when dashboards are hosted)
- Separate data file (extract when list grows meaningfully)
