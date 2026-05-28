# Gym Dashboard Mobile Responsiveness

**Date:** 2026-05-28  
**Status:** Approved

## Goal

Make the gym dashboard clean and intentional at phone (390px) and iPad portrait (810px) without changing the desktop experience. Both sizes are used equally for analytics and workout logging.

## Breakpoint strategy

Use the two existing breakpoints only. No new breakpoints.

| Breakpoint | Target |
|---|---|
| `max-width: 720px` | Phone (iPhone ~390px) |
| `max-width: 1080px` | Tablet + below (iPad ~810px, laptop narrowband) |

The `1080px` breakpoint already collapses `mainGrid` to a single column. Tablet-specific fixes (body diagram height) attach to this existing breakpoint.

## Changes

### 1. `components/dashboard/TimeRangeSelector.module.css`

At `max-width: 720px`:
- `.group` becomes `display: flex; width: 100%`
- `.btn` gets `flex: 1; text-align: center`

Result: the four time range buttons (Day / 7d / 30d / YTD) stretch to fill the full content width on phone. Visually matches the editorial block aesthetic, easy to tap.

### 2. `app/dashboards/gym/GymDashboard.module.css`

At `max-width: 720px`:
- `.controls` becomes `flex-direction: column; align-items: center; gap: var(--space-3)`
- `.downloadBtn` gets `margin-left: 0` (removes the auto-push)
- `.navArrow` bumps to `width: 40px; height: 40px` for touch

Result: controls bar stacks as three clean rows — time range (full width), date nav (centered, only in day/year mode), Download button (centered, natural width). Nothing wraps unexpectedly. Nav arrows are comfortably tappable.

### 3. `components/dashboard/StatWidget.module.css`

At `max-width: 720px`:
- `.value` font-size steps down from `--text-3xl` (2.25rem) to `--text-2xl` (1.875rem)

Result: KPI numbers read cleanly in full-width single-column panels without feeling oversized.

### 4. `app/dashboards/gym/panels/BodyDiagram.module.css`

At `max-width: 1080px`:
- `.container` height reduces from `440px` to `360px`

At `max-width: 720px`:
- `.container` height reduces further to `300px`

Result: when the body diagram stacks below the charts (which happens at all tablet and phone widths due to the existing `mainGrid` collapse), it no longer dominates vertical real estate. 300px on phone is still comfortably portrait-oriented for the 3D figure.

### 5. `components/dashboard/DashboardShell.module.css`

At `max-width: 720px`:
- `.tabBar` gets `width: 100%`
- `.tab` gets `flex: 1; text-align: center; padding: var(--space-3) var(--space-2)`

Result: the Dashboard and Log Workout tabs each take half the bar width on phone, making them easier to tap and visually consistent with the stretched time range buttons.

## What is NOT changing

- All existing breakpoints (`mainGrid` collapse at 1080px, `splitRow` / `twoCol` / `kpiRow` collapse at 720px, `SevenDayStrip` scroll at 600px) — these are already correct and stay as-is.
- `DashboardPanel` padding (`--space-5`) — intentional on all screen sizes.
- `WorkoutForm` — already centered with `max-width: 560px; margin: 0 auto`, works well on phone and tablet.
- `FloatingChatWidget` — fixed bottom-right, standard pattern, not touched.
- `SplitFrequency` 3-column tile grid — at phone width the panel is full-width, giving each tile ~106px, which fits the small Push / Pull / Legs content comfortably.
- `VolumeHeatmap`, `ExercisePRsTable`, `RecentSessions`, `DailyView` panels — already have adequate breakpoints or are structurally fine at target widths.

## Files changed

| File | Change |
|---|---|
| `components/dashboard/TimeRangeSelector.module.css` | Full-width stretch at 720px |
| `app/dashboards/gym/GymDashboard.module.css` | Controls stacking + nav arrow size at 720px |
| `components/dashboard/StatWidget.module.css` | Font step-down at 720px |
| `app/dashboards/gym/panels/BodyDiagram.module.css` | Height reduction at 1080px and 720px |
| `components/dashboard/DashboardShell.module.css` | Tab stretch at 720px |

5 CSS files. No TypeScript changes. No new components. No new breakpoints.
