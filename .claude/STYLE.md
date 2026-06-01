# Style Guide: Data With Dillon

Single source of truth for design decisions. Any agent or engineer adding UI must read this first.

## Tokens

All design values live in `styles/tokens.css`. Never use raw hex, rgb, or rem values in component files. Never declare `font-family` outside `tokens.css`.

## Typography

| Element | Font | Size | Weight | Leading | Case | Tracking |
|---|---|---|---|---|---|---|
| H1 | serif | 4xl | 400 | tight | sentence | tight |
| H2 | serif | 3xl | 400 | tight | sentence | tight |
| H3 | serif | xl | 500 | snug | sentence | tight |
| Body prose | serif | md | 400 | loose | sentence | normal |
| Lead paragraph | serif | lg | 400 | normal | sentence | normal |
| Nav / UI labels | sans | sm | 500 | snug | UPPERCASE | wide |
| Eyebrow / metadata | sans | xs | 400 | snug | UPPERCASE | wide |
| Inline code | mono | sm | 400 | normal | as-is | normal |

Body prose max-width: 60–75ch. Hyphenation on. `hanging-punctuation: first last`.

## Components

Eight primitives in `components/ui/`. No others without updating this file first.

| Name | File | Variants | Use when | Never use for |
|---|---|---|---|---|
| Button | Button.tsx | primary, outline, ghost | CTAs and actions | Navigation |
| Link | Link.tsx | inline, nav | Body links, nav links | Buttons |
| Card | Card.tsx | none | Certs, resumes, capabilities | Cards within cards |
| Input | Input.tsx | input, textarea | Contact form only | none |
| Badge | Badge.tsx | none | Skill tags, status | More than 3 per card |
| Rule | Rule.tsx | hairline, medium | Section dividers | Decorative |
| PageHeader | PageHeader.tsx | rule={false} | Every page top | Mid-page headings |
| DashboardCard | DashboardCard.tsx | none | Dashboard list entries | Nested cards |
| Table | Table.tsx | none | Tabular data | Layout |
| CodeBlock | CodeBlock.tsx | none | Code samples | Long prose |

## Layout

- Prose pages: `max-width: var(--content-width)` (680px)
- Horizontal padding: `var(--gutter)` mobile, `var(--space-7)` at >=720px
- Use `.page-wrapper` class from `globals.css`

## Breakpoints

- `<720px`: mobile (default)
- `>=720px`: tablet (header nav expands)
- `>=1080px`: desktop (max widths apply)

No other breakpoints without updating this file.

## Punctuation

- No em dashes (—) or en dashes (–) anywhere in the site copy
- Use commas, colons, or rephrase the sentence instead
- Hyphens in compound modifiers are fine (e.g. "data-centric", "life-science")
- Interpuncts (·) are allowed for eyebrow separators only

## CSS Precedence (Next.js 15)

Next.js 15 sorts stylesheets by `data-precedence` value alphabetically, not by `<link>` order. Page-level CSS modules (`app/...`) load before the root bundle (`[root-of-the-server]`) because `a` < `[`. This means a page-level rule cannot override a component rule by source order alone — the component's rule always wins.

**Consequences:**
- Never try to suppress a component's border/style from a page-level CSS module using equal-specificity rules. It will silently lose.
- If a page needs a component to behave differently (e.g. no `border-top` on first item, no `<hr>` in `PageHeader`), expose a prop on the component instead.

**Pattern:** When a page needs to opt out of a default visual, add a boolean prop to the component (`rule={false}`, `topBorder={false}`, etc.) rather than overriding from the page stylesheet.

## Dashboard Components

Eight framework primitives in `components/dashboard/`. Use these for any dashboard feature.

| Name | File | Use when |
|---|---|---|
| DashboardShell | DashboardShell.tsx | Tab navigation wrapper for dashboard pages |
| DashboardPanel | DashboardPanel.tsx | Section container with optional eyebrow label |
| StatWidget | StatWidget.tsx | Single KPI stat with label, value, optional sub |
| ChartWrapper | ChartWrapper.tsx | Recharts ResponsiveContainer with empty state |
| TimeRangeSelector | TimeRangeSelector.tsx | Time range button group (Day / 7d / 30d / YTD) |
| PasswordGate | PasswordGate.tsx | Client-side gate backed by server action auth |
| FloatingChatWidget | FloatingChatWidget.tsx | Fixed bottom-right AI chat panel |
| Pager | Pager.tsx | Prev / Next pagination controls |

Dashboard pages use `.page-wrapper--wide` from `globals.css` (max-width: `--content-width-wide`).

Chart colors use `--chart-bp-*` and `--chart-primary/secondary/muted` tokens from `tokens.css`. Three.js / SVG elements that cannot use CSS variables may use the matching hardcoded hex values defined in `tokens.css` comments.

## Dashboard Panel System

Every widget, visualization, and model sits in a panel. Panels are the only visual containers on dashboards — no borders, no rules, just background color.

- **Background:** `var(--color-rule-soft)` (`#EBE3D5`) — warm earthy beige, clearly distinct from the page background (`--color-paper` = `#F7F3EC`)
- **Padding:** `var(--space-5)` on all sides
- **Gap between panels:** `var(--space-4)` everywhere (grid/flex gap, not margin)
- **Cards inside a panel** (e.g. session cards): use `var(--color-paper)` background to appear "lifted" against the panel
- **KPI stat row:** each StatWidget is its own panel box via `.kpiRow > * { background: var(--color-rule-soft); padding: var(--space-5) }` — no shared panel wrapper, no separator lines between stats
- **No separating lines anywhere** — `border-top`, `border-bottom`, `border-left` between sections are forbidden; depth comes from background color and spacing only
- **Accent indicators within panels** (e.g. SplitFrequency tiles): use a `3px left border`, not a top rule
- **Tab navigation active state:** background fill (`var(--color-rule-soft)`), not an underline border
- **Pager component:** no `border-top` — sits flush within its panel's padding

## Hard Rules

- No `border-radius` > 2px
- No `box-shadow` on UI elements
- No gradient backgrounds
- No emoji in nav, headers, or buttons
- One accent color: `--color-accent` (oxblood)
- Depth via panel background color and spacing, never shadows or rules
