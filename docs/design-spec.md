# Design Spec: Studio Ledger

Locked 2026-08-04 by owner. Every redesign ticket builds against this spec.
It replaces the visual system described in .claude/STYLE.md (which will be
rewritten to match at the end of the redesign). ASCII only in this file and
in all site copy.

Direction: modern studio minimal (near-white gallery, grotesk-led, generous
negative space, index lists over card grids) with an engineering-ledger
register (mono metadata, visible hairline structure, spec-sheet hero data).
Carried from the old system: token discipline, one accent, no shadows, no
gradients, no border-radius over 2px, no emoji, no em or en dashes.
Dropped: the cream paper palette, serif typography, interpunct separators,
one-width-fits-all 680px pages.

## Not-this list (hard)

No gradient hero, no glassmorphism, no purple-blue blobs, no emoji icons,
no centered-everything, no stock "building the future of X" copy, no card
grids where a list will do, no scroll-triggered animation.

## Color tokens (all values live in styles/tokens.css, names unchanged
## where possible so component CSS keeps working)

| Token | Value | Role |
|---|---|---|
| --color-paper | #FAFAF8 | page background (near-white, warm) |
| --color-paper-2 | #FFFFFF | raised cards, inputs |
| --color-ink | #111110 | primary text |
| --color-ink-2 | #44403B | secondary text |
| --color-ink-3 | #6F6B64 | muted text, metadata |
| --color-rule | #E3E1DB | hairline rules, borders |
| --color-rule-soft | #F1EFEA | dashboard panel background |
| --color-accent | #7A2E2E | oxblood: links, buttons, chart primary |
| --color-accent-hover | #5C2020 | hover state |
| --color-accent-soft | #F3E7E4 | accent tint backgrounds |
| --color-positive | #4A6B3A | unchanged |
| --color-warn | #B8893B | unchanged |

NOTE the panel relationship INVERTS from the old system: panels (#F1EFEA)
are now slightly DARKER than the page (#FAFAF8). The old "panels lift out
lighter" gotcha in CLAUDE.md is obsolete once the retheme ticket lands.

Chart tokens: the 12 --chart-bp-* hues are kept (dark enough to read on
near-white). --chart-primary #7A2E2E, --chart-secondary #44403B,
--chart-muted #D9D6CE, --chart-na #ECEAE4.

Hardcoded-hex sync sites (Three.js and SVG cannot read CSS vars): the
BodyDiagram clear color and NA color MUST equal --color-rule-soft
(#F1EFEA). Heatmap palette on the new base:
na #ECEAE4, then #EFE0DD, #D9AFA9, #B97B72, #98524A, #7A2E2E.
BodyDiagram heat scale keeps its red/amber/green trained hexes.

## Typography

Fonts via next/font/google, mapped in tokens.css. font-family is declared
nowhere else.

| Var | Font | Weights | Role |
|---|---|---|---|
| --font-display | Schibsted Grotesk | 500, 600, 700 | h1-h3, display |
| --font-sans | Inter | 400, 500 | body, UI |
| --font-mono | JetBrains Mono | 400, 500 | eyebrows, labels, metadata, numbers, code |

--font-serif is removed. Body default is --font-sans.

Type scale (names kept, values changed):
xs .75rem / sm .875rem / base 1rem / md 1.125rem / lg 1.25rem /
xl 1.5rem / 2xl 1.875rem / 3xl 2.25rem / 4xl clamp(2.75rem, 6vw, 4rem)

Leading: tight 1.1 (display), snug 1.3, normal 1.5, loose 1.7.
Tracking: tight -0.02em (display), wide 0.08em (mono labels, uppercase).

Register rules:
- Eyebrows and metadata: --font-mono, uppercase, --text-xs, tracking wide,
  --color-ink-3. Separator between metadata terms is " / " (ASCII).
- Headings: --font-display, weight 600, tracking tight, sentence case.
- Body: --font-sans 400, --text-base or --text-md, max measure 68ch.
- Numbers in dashboards: --font-mono.

## Spacing, layout, grid

Spacing scale unchanged (--space-1..9 = 4/8/12/16/24/32/48/64/96px) plus
new --space-10: 128px for section breathing on home.

- --content-width: 720px (prose pages: about, contact, rss, 404)
- --content-width-wide: 1100px (home, dashboards)
- Home and dashboards: 12-column grid, asymmetric placement, left-aligned.
  Never center body text.
- Hairline structure: section boundaries are 1px --color-rule lines,
  full-bleed within the content width. Rules ARE allowed in the new system
  (the old "no separating lines" dashboard rule is dropped for page
  surfaces; dashboard PANELS remain rule-free, separated by background and
  gap).
- Breakpoints unchanged: 720px, 1080px. Must work from 320px.

## Motion

Micro only: 120ms/180ms opacity, color, and transform transitions on
hover/focus. No scroll-triggered animation, no parallax, no autoplaying
motion except the existing gym BodyDiagram autoRotate. A global
prefers-reduced-motion block sets transition-duration and
animation-duration to 0.01ms and disables BodyDiagram autoRotate.

## Hero treatment (home)

No name headline (the name lives in the header wordmark and title tag).
Structure, top to bottom, left-aligned in the wide grid:

1. Mono metadata line with hairline rule running to the right edge:
   "DATA ANALYST / ENGINEER"
2. h1 statement at --text-4xl, --font-display 600, max 16 words:
   "I do data work for healthcare and life science teams."
3. Supporting line at --text-lg, --color-ink-2, max 50ch:
   "Pipelines, analytics, and whatever else it takes to ship something
   useful."
4. Ledger meta row (mono, xs, uppercase, three items with " / "):
   "CURRENTLY: DATA SCIENTIST, ANSWER ALS" plus links "GITHUB" "LINKEDIN"
5. Actions: one primary button "Get in touch" -> /contact, one underlined
   text link "About me" -> /about.

## Component register

- Buttons: rectangular, 2px radius max, accent fill primary / 1px rule
  outline secondary, mono uppercase xs label OR sans medium sm label
  (pick mono; it carries the ledger register).
- Links in prose: ink text, 1px underline, accent on hover.
- Index lists replace card grids: each row = mono index number (01, 02),
  display-font title, sans description, mono tag list. 1px rule between
  rows. Used on home (The work) and /demos.
- Tables and data: mono numerals, right-aligned numeric columns, hairline
  row rules.
- Forms: white (--color-paper-2) inputs, 1px --color-rule border, 2px
  radius, accent focus ring (2px outline), mono uppercase xs labels.
- Dashboard panels: --color-rule-soft background, --space-5 padding,
  --space-4 gap, no borders (unchanged pattern, new colors).
- Dark chart tooltips stay: --color-ink background, --color-paper text.

## Accessibility floor (every ticket)

WCAG 2.1 AA contrast (ink #111110 on #FAFAF8 is 17+:1; accent #7A2E2E on
#FAFAF8 is 8.9:1; ink-3 #6F6B64 on #FAFAF8 is 5.0:1 - keep ink-3 at
--text-xs only for metadata, never body copy). Keyboard navigable, visible
focus (2px accent outline, 2px offset), semantic headings in order,
prefers-reduced-motion respected, 320px minimum width.

## Copy rules

First person, specific, plain. No buzzwords, no hedges, no "passionate",
no "leverage". ASCII only: no em dashes, en dashes, smart quotes,
ellipsis characters, arrows, interpuncts, or emoji. Existing site copy is
kept verbatim where a ticket says so; anything rewritten follows these
rules.

## Page specs

Per-page design specs that build on this document live alongside it:

- `docs/reddit-pipeline-overview.md` - Reddit pipeline overview page and its
  per-channel carousel (P5-T61).
