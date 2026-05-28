# Gym Dashboard — Design Spec

**Date:** 2026-05-28  
**Status:** Approved  
**Source project:** `/Users/dillon/Desktop/projects/dillon-shearer-website`

---

## Overview

Port the gym tracker from the source project into the portfolio as the first live dashboard. Combines three tools: analytics dashboard, workout entry form, and AI chat widget. This work also establishes a reusable dashboard framework (`components/dashboard/`) that every future dashboard will build on.

---

## Route & Navigation

- **URL:** `/dashboards/gym`
- **Entry point:** Add a new `DashboardCard` to `app/dashboards/page.tsx` pointing to `/dashboards/gym`
- **Page layout:** Two tabs rendered by `DashboardShell`:
  - `Dashboard` — analytics view (default tab)
  - `Log Workout` — password-gated entry form
- **Page header:** Standard `PageHeader` with `rule={false}`, eyebrow "DASHBOARDS", title "Gym Tracker", lead "Personal training log, volume analytics, and AI coaching."
- **Wide layout:** Uses `--content-width-wide` (1080px) not the default 680px prose width

---

## Theme

Unified with the rest of the portfolio. No dark islands, no Tailwind classes, no hardcoded hex values. Every style goes through `styles/tokens.css` and component-level CSS Modules.

- Background: `--color-paper`
- Text: `--color-ink`, `--color-ink-2`, `--color-ink-3`
- Borders: `--color-rule`, `--color-rule-soft`
- Accent / highlight: `--color-accent` (oxblood `#7A2E2E`)
- Charts: ink tones for bars/lines, oxblood for peak/emphasis values
- No `border-radius` > 2px, no `box-shadow`, no gradients
- Typography follows `.claude/STYLE.md` exactly

---

## Layer 1 — Dashboard Framework (`components/dashboard/`)

These components know nothing about gym data. They are generic primitives reused by every future dashboard.

### `DashboardShell`
Two-tab layout wrapper. Props: `tabs: { label: string; key: string }[]`, `activeTab: string`, `onTabChange`. Renders tab bar with active underline using `--color-accent`. Manages which tab content is visible.

### `DashboardPanel`
Titled section container. Props: `title?: string`, `eyebrow?: string`, `children`. Renders a `border-top: 1px solid --color-rule` section with consistent padding. The structural box every chart and widget lives inside.

### `StatWidget`
Single stat display. Props: `label: string`, `value: string | number`, `sub?: string`, `accent?: boolean`. Renders eyebrow label (sans, xs, uppercase) + large serif number. `accent` colors the value in `--color-accent`. Used in both KPI rows.

### `ChartWrapper`
Standardizes Recharts container sizing. Props: `height?: number`, `children`. Handles `ResponsiveContainer`, consistent padding, and empty/loading states using portfolio tokens. All Recharts components (axes, grids, tooltips) must use portfolio token colors — no hardcoded values.

### `TimeRangeSelector`
Pill/segment button group. Props: `options: { label: string; value: string }[]`, `value: string`, `onChange`. Renders borderless segment buttons; active button gets `background: --color-ink`, `color: --color-paper`. Reusable for any time-based filter.

### `PasswordGate`
Wraps any content with a password prompt. Props: `children`, `storageKey?: string` (for sessionStorage). Shows a centered form with a single password input; on success stores auth in sessionStorage and renders children. Uses `LIFT_PASSWORD` env var server-side via a Server Action for validation.

### `FloatingChatWidget`
Fixed bottom-right chat panel. Props: `apiEndpoint: string`. Renders a circular ink-dark button (44px) with an SVG speech bubble icon. On click, expands to a chat panel (420px wide, 600px tall max) anchored to bottom-right, viewport-clamped. Accepts `apiEndpoint` so it is wired to any dashboard's AI route without knowing gym-specific details. Handles open/close, message list, scroll, and input. Uses portfolio typography throughout.

### `Pager`
Prev/Next pagination control. Props: `page`, `totalPages`, `onPrev`, `onNext`. Renders `← Prev · 1 / N · Next →` in sans xs uppercase. Used by PRs table, body parts, recent sessions.

---

## Layer 2 — Gym Dashboard Tab (`app/dashboards/gym/`)

### Dashboard Tab — Aggregate View (7d / 30d / YTD)

Shown when `mode !== 'day'`. Panels in order:

**Time range selector + date navigation**
`TimeRangeSelector` with options: Day, 7D, 30D, YTD. Year mode also shows prev/next year arrows. Day mode shows prev/next day arrows with the selected date label. A "Back" button appears in Day mode if the user drilled in from an aggregate view. Download button lives here (see Download section).

**KPI row — 3 StatWidgets**
- Total Volume (lbs) — `accent` when at personal best for the period
- Gym Days (n / total days in window)
- Exercise Variety (unique exercises)

**Volume chart + Body Diagram sidebar** (two-column: `1fr 220px`)
- Left: `VolumeChart` inside `ChartWrapper` (bar chart of volume per day in the window) + below it the split/body-part row
- Split row (two columns):
  - `SplitFrequency`: Push / Pull / Legs day counts, each with a color-coded top border (oxblood / ink-2 / rule)
  - `BodyPartFrequency`: Paginated chip list (6/page via `Pager`), each chip shows body part name + set count
- Right sidebar (sticky on xl+): `BodyDiagram` (Three.js, shows muscles trained colored by volume). Existing 3D logic ported verbatim, colors adapted to oxblood/ink palette.

**Exercise PRs + Volume Heatmap** (two-column: `1fr 1fr`)
- `ExercisePRsTable`: Sortable table (exercise, weight, est 1RM, best set, date). Columns toggle asc/desc. Paginated 5/page via `Pager`. Est 1RM uses Epley formula: `weight × (1 + reps/30)`. Info tooltip on "Est 1RM" header.
- `VolumeHeatmap`: `flex: 1` so it fills container height regardless of panel size. Color scale uses oxblood intensity (light rule → ink-2 → oxblood). Info tooltip. Existing `Heatmap.tsx` logic ported verbatim, colors swapped.

**Recent Sessions** (full width, 3-column card grid, paginated 3/page via `Pager`)
- Each card: date (serif), day tag (colored by split type), volume, exercise count, set count
- Click navigates to Day view for that date (sets `mode = 'day'`, stores `prevMode` for Back button)

### Dashboard Tab — Day View

Shown when `mode === 'day'`. Completely replaces aggregate panels. Panels in order:

**7-day strip**
7 clickable day buttons spanning the past 6 days + today. Active day highlighted with `background: --color-accent`, `color: --color-paper`. Days with data use `--color-ink`; days without data use `--color-ink-3`. Horizontally scrollable on mobile.

**4 KPI StatWidgets**
- Total Volume (lbs)
- Exercises · Sets · Reps (combined display)
- Top Body Part (name of muscle group with most volume)
- Near-Max Sets (count of sets ≥ 90% of lifetime estimated 1RM for that exercise)

**Charts** (two-column: `2fr 1fr`)
- `CumulativeVolumeChart`: Area chart, cumulative volume over sets in session order, filled/stroked by body part using ink-tone color scale. Legend shows body parts present in session.
- `MuscleVolumeDonut`: Pie/donut chart showing volume distribution by body part. Same ink-tone color scale.

**Exercise Table**
Grouped by exercise: exercise name header, then a row per set showing set number, weight, reps, est 1RM. Styled using portfolio `Table` component conventions (hairline borders, monospace numerics).

---

## Layer 2 — Log Workout Tab

`PasswordGate` wraps the entire tab content. On auth, renders the workout entry form.

### Form — Fields (unchanged from source)
- Date (date picker, defaults to today)
- Workout Day (optional tag: Push Day / Pull Day / Leg Day — auto-selects body parts)
- Body Parts (multi-select, 12 options, cached in localStorage)
- Exercise (dropdown filtered by body parts, with "Manage Exercises" modal)
- Equipment (Smith Machine / Cable Stack / Machine / Dumbbells / Curl Bar / Barbell)
- Weight (numeric, 0–1500 lbs, step 2.5)
- Reps (numeric, minimum 1)
- Unilateral (checkbox)

### Form — Sheets / Modals (unchanged logic, restyled)
- Day Info sheet: set/change date and workout day tag
- Body Parts sheet: multi-select with localStorage caching
- Exercise Manager modal: add, rename, change body part, delete (soft)
- Edit modal: modify any field of an existing set including resequencing

### Form — Live History
Real-time display of sets logged for the selected date, grouped by exercise, with edit and delete buttons per set.

### Form — Known Logic Bugs (fix during port)
The implementing agent should audit and fix these:
1. **Unilateral double-count**: Unilateral sets (single-limb exercises) are currently included in volume calculations at face value. The correct behavior needs investigation — either volume should be halved for unilateral sets (since only one limb was worked), or the field should be informational only with no effect on volume math. Decide and apply consistently across all volume calculations (dashboard, download, chat context).
2. **Download issues**: The download modal/export feature has known faulty logic. Audit `buildDownloadUrl` and the API route (`/api/gym-data`, `/api/gym-data.csv`) for correctness. Ensure the exported data matches what is currently filtered on screen.

### Form — Enhancement Latitude
The implementing agent has explicit permission to propose and implement UX improvements to the form during the port. Examples of areas to consider (but not limited to): better mobile input flow, smarter exercise defaults, clearer feedback on save/error, improved set reordering UX, accessibility improvements. Do not change the data model or server actions without flagging it first.

---

## Layer 2 — Floating Chat Widget (Dashboard Tab Only)

`FloatingChatWidget` rendered inside the Dashboard tab (not the Log Workout tab). Wired to `/api/gym-chat`. The chat panel UI is rebuilt from scratch using portfolio tokens -- all `ChatClient.tsx` styles removed. Logic (message sending, streaming, markdown rendering, chart rendering, follow-up suggestions, citations) ported verbatim from source `ChatClient.tsx`. Chart rendering inside chat uses `ChartWrapper` with portfolio colors.

The underlying AI engine (OpenAI GPT-4o, all 12 `lib/gym-chat/` modules, SQL policy, canonical plans, conversation state) is copied verbatim. No changes to chat intelligence in this task -- that is a future task.

---

## Layer 3 — Data Layer (ported verbatim)

### Files to copy
- `lib/gym-chat/*` — all 12 modules, no changes
- `app/api/gym-chat/route.ts` — no changes
- `app/demos/gym-dashboard/form/actions.ts` → `app/dashboards/gym/actions.ts` — no changes to logic
- `app/api/gym-data/route.ts` and `app/api/gym-data.csv/route.ts` — audit for bugs (see Download above), fix if needed

### Database
Same Neon PostgreSQL instance. Tables: `gym_lifts`, `gym_day_meta`, `exercise_catalog`. No migrations needed.

### Environment variables to add to `.env.local`
```
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
GYM_CHAT_DATABASE_URL_READONLY=...
OPENAI_API_KEY=...
LIFT_PASSWORD=...
```
Values come from source project's `.env.local`.

### New npm packages to install
- `recharts`
- `@react-three/fiber`
- `three`
- `@types/three`
- `@vercel/postgres`
- `react-markdown`
- `pgsql-ast-parser`

---

## Download Feature

Download button sits in the filter row alongside the `TimeRangeSelector`. Opens a modal with:
- Range: "Current filter" or "All time"
- Format: CSV or JSON
- Download button triggers the data API endpoint with appropriate query params

Restyled to portfolio aesthetic. Logic audited and fixed for known bugs (see Layer 2 form section).

---

## Component File Map

```
components/dashboard/
  DashboardShell.tsx + .module.css
  DashboardPanel.tsx + .module.css
  StatWidget.tsx + .module.css
  ChartWrapper.tsx + .module.css
  TimeRangeSelector.tsx + .module.css
  PasswordGate.tsx + .module.css
  FloatingChatWidget.tsx + .module.css
  Pager.tsx + .module.css

app/dashboards/gym/
  page.tsx                    (server component, fetches all lifts, passes to client)
  GymDashboard.tsx            (client orchestrator, mode state, tab state)
  GymDashboard.module.css
  actions.ts                  (server actions: CRUD for form, ported from source)

  panels/
    VolumeChart.tsx + .module.css
    SplitFrequency.tsx + .module.css
    BodyPartFrequency.tsx + .module.css
    BodyDiagram.tsx + .module.css       (Three.js, ported verbatim, colors adapted)
    ExercisePRsTable.tsx + .module.css
    VolumeHeatmap.tsx + .module.css
    RecentSessions.tsx + .module.css
    DailyView/
      index.tsx
      SevenDayStrip.tsx
      CumulativeVolumeChart.tsx
      MuscleVolumeDonut.tsx
      ExerciseTable.tsx

  form/
    WorkoutForm.tsx + .module.css       (PasswordGate wrapping full form)
    ExerciseManagerModal.tsx + .module.css
    BodyPartsSheet.tsx + .module.css
    DayInfoSheet.tsx + .module.css
    EditSetModal.tsx + .module.css

lib/
  gym-chat/                             (all 12 modules, verbatim copy)

app/api/
  gym-chat/route.ts                     (verbatim copy)
  gym-data/route.ts                     (audited copy)
  gym-data.csv/route.ts                 (audited copy)
```

---

## Hard Limits

- **DO NOT modify the database schema, tables, or data in any way.** The Neon PostgreSQL database contains valuable real gym data that must not be altered. No `ALTER TABLE`, no `DROP`, no `DELETE`, no `INSERT` outside of the form's existing server actions, no schema migrations of any kind. The database is read-only from the dashboard's perspective (chat uses the readonly connection string). The form's existing `INSERT`/`UPDATE`/`DELETE` server actions are the only permitted writes, and their logic must not change.

---

## Known Constraints & Gotchas

- **CSS precedence**: Per `.claude/AGENTS.md`, page-level CSS Modules cannot override component styles. Use component props.
- **No em/en dashes**: All copy uses commas, colons, or rephrasing.
- **No border-radius > 2px**: Applies to all new components including chat panel and form modals.
- **No box-shadow**: Depth via rules and whitespace only.
- **Recharts colors**: Every `fill`, `stroke`, `color` prop must use CSS variable values, not hex literals.
- **Three.js SSR**: `BodyDiagram` must remain a `'use client'` component with dynamic import (`next/dynamic`, `ssr: false`).
- **Wide layout**: Dashboard page uses `--content-width-wide` (1080px). Do not use `.page-wrapper` (which caps at 680px). Create a `page-wrapper--wide` variant or inline the max-width.
- **Tabs are client state**: `DashboardShell` is a client component. The server page fetches data and passes it down.
- **STYLE.md compliance**: All new components must be reviewed against `.claude/STYLE.md` before considering them complete.
