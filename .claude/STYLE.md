# Studio Ledger Style Guide

Read this before adding or changing UI. `docs/design-spec.md` is the locked
design rationale; this file is the operational rule set. Use existing tokens
and primitives before creating anything new.

## Core rules

- Keep the Studio Ledger register: near-white gallery surfaces, grotesk-led
  typography, mono metadata, hairline structure, and index lists over card grids.
- Do not add colors, fonts, radii, shadows, gradients, breakpoints, component
  variants, or layout primitives without updating this document first.
- No border-radius above 2px, box shadows, gradients, emoji, centered body text,
  card grids where an index list will work, or scroll-triggered animation.
- Use CSS variables from `styles/tokens.css`; component files do not introduce
  raw color values or font families. The documented Three.js and SVG sync sites
  are the exception.

## Tokens

`styles/tokens.css` is the source of truth. These tables mirror its current
values exactly.

### Colors

| Token | Value | Use |
| --- | --- | --- |
| `--color-paper` | `#fafaf8` | Page background |
| `--color-paper-2` | `#ffffff` | Raised cards and inputs |
| `--color-ink` | `#111110` | Primary text |
| `--color-ink-2` | `#44403b` | Secondary text |
| `--color-ink-3` | `#6f6b64` | Metadata and muted text |
| `--color-rule` | `#e3e1db` | Hairline rules and borders |
| `--color-rule-soft` | `#f1efea` | Dashboard panels |
| `--color-accent` | `#7a2e2e` | Links, buttons, primary charts |
| `--color-accent-hover` | `#5c2020` | Accent hover state |
| `--color-accent-soft` | `#f3e7e4` | Accent-tint backgrounds |
| `--color-positive` | `#4a6b3a` | Positive status |
| `--color-warn` | `#b8893b` | Warning status |

| Token | Value |
| --- | --- |
| `--chart-bp-chest` | `#7a2e2e` |
| `--chart-bp-back` | `#4a4239` |
| `--chart-bp-shoulders` | `#b8893b` |
| `--chart-bp-biceps` | `#4a6b3a` |
| `--chart-bp-triceps` | `#5a7a8a` |
| `--chart-bp-quads` | `#5c3a1a` |
| `--chart-bp-hamstrings` | `#1a4a3a` |
| `--chart-bp-core` | `#3a1a4a` |
| `--chart-bp-glutes` | `#9a5a3a` |
| `--chart-bp-calves` | `#3a6b5a` |
| `--chart-bp-forearms` | `#6b6b3a` |
| `--chart-bp-hips` | `#5a3a6b` |
| `--chart-primary` | `#7a2e2e` |
| `--chart-secondary` | `#44403b` |
| `--chart-muted` | `#d9d6ce` |
| `--chart-na` | `#eceae4` |

### Typography

| Token | Value | Role |
| --- | --- | --- |
| `--font-display` | `var(--next-font-display), system-ui, sans-serif` | Schibsted Grotesk, weights 500/600/700; headings and display |
| `--font-sans` | `var(--next-font-sans), system-ui, sans-serif` | Inter, weights 400/500; body and UI |
| `--font-mono` | `var(--next-font-sans), system-ui, sans-serif` | Inter (shared with `--font-sans`); labels, metadata, numbers, and code. Token name kept for historical reasons; no separate monospace face is loaded. |

| Token | Value | Token | Value |
| --- | --- | --- | --- |
| `--text-xs` | `0.75rem` | `--text-sm` | `0.875rem` |
| `--text-base` | `1rem` | `--text-md` | `1.125rem` |
| `--text-lg` | `1.25rem` | `--text-xl` | `1.5rem` |
| `--text-2xl` | `1.875rem` | `--text-3xl` | `2.25rem` |
| `--text-4xl` | `clamp(2.75rem, 6vw, 4rem)` | `--leading-tight` | `1.1` |
| `--leading-snug` | `1.3` | `--leading-normal` | `1.5` |
| `--leading-loose` | `1.7` | `--tracking-tight` | `-0.02em` |
| `--tracking-wide` | `0.08em` | | |

- Headings use display, weight 600, tight tracking, tight leading, and sentence case.
- Body copy uses sans at base or md with a maximum measure of 68ch.
- Eyebrows, labels, metadata, and dashboard numbers use `--font-mono` (which now
  resolves to Inter, the same face as `--font-sans`). Labels are uppercase, xs, and
  wide-tracked. Separate metadata terms with ` / `.

### Spacing, layout, and motion

| Token | Value | Token | Value |
| --- | --- | --- | --- |
| `--space-1` | `4px` | `--space-2` | `8px` |
| `--space-3` | `12px` | `--space-4` | `16px` |
| `--space-5` | `24px` | `--space-6` | `32px` |
| `--space-7` | `48px` | `--space-8` | `64px` |
| `--space-9` | `96px` | `--space-10` | `128px` |
| `--content-width` | `720px` | `--content-width-wide` | `1100px` |
| `--gutter` | `var(--space-5)` | `--radius-sm` | `2px` |
| `--radius-md` | `2px` | `--rule-hairline` | `1px` |
| `--rule-medium` | `2px` | `--ease-out` | `cubic-bezier(0.2, 0.7, 0.2, 1)` |
| `--duration-fast` | `120ms` | `--duration` | `180ms` |

- Prose pages use `--content-width`; home and dashboards use `--content-width-wide`.
- Use 12-column, left-aligned grids for home and dashboards. Preserve usable layouts at 320px.
- The only breakpoints are 720px and 1080px.
- Use hairline `--color-rule` boundaries for page structure. Dashboard panels remain rule-free.
- Motion is limited to 120ms or 180ms color, opacity, or transform changes. Respect the
  global reduced-motion rule; do not add parallax or scroll-triggered motion.

## Component register

The eight public UI exports live in `components/ui/index.ts`. Route-local layout
primitives are listed after them and are not exported from that barrel.

| Export | File | Use |
| --- | --- | --- |
| `Badge` | `Badge.tsx` | Short tags, up to three per card |
| `Button` | `Button.tsx` | Primary, outline, or ghost actions; internal `href` values use Next links |
| `InlineLink` | `Link.tsx` | Links in body copy |
| `NavLink` | `Link.tsx` | Header, footer, and mobile navigation |
| `Card` | `Card.tsx` | Certifications, resumes, and capabilities |
| `Input` | `Input.tsx` | Contact-form input and textarea fields |
| `PageHeader` | `PageHeader.tsx` | Page-top eyebrow, title, lead, and optional rule |
| `DashboardCard` | `DashboardCard.tsx` | Numbered dashboard index rows |
| Channel card | `app/demos/reddit-pipeline/ChannelCarousel.tsx` | Route-local layout primitive: a card carrying a full-bleed banner image, a square logo, a name, and outbound links. Not a shared export; copy the pattern rather than reaching for it |

- Buttons are rectangular, at most 2px radius, and use mono uppercase xs labels.
- Prose links use a 1px underline and change to accent on hover.
- Index rows use a mono number, display title, sans description, mono tags, an optional mono stats line, and a 1px rule.
- Image-bearing cards keep the artwork square or full-bleed with no radius above 2px and no shadow. Banners crop with `object-fit: cover` at a capped height so a card never becomes mostly picture at 320px. Every image is a `next/image` with explicit `width` and `height`, and a logo that repeats an adjacent name takes `alt=""`.
- Forms use `--color-paper-2`, a 1px `--color-rule` border, 2px radius, and visible accent focus.
- Tables use mono numerals, right-aligned numeric columns, and hairline row rules.

## Dashboard panels

- Panels use `--color-rule-soft` (`#f1efea`), `--space-5` padding, and `--space-4` gaps.
- Panels are darker than the page: `#f1efea` versus `#fafaf8`. This inversion is intentional;
  do not "fix" panels to be lighter than the page.
- Do not add panel borders. Use panel background and spacing for separation.
- Dark chart tooltips use `--color-ink` background and `--color-paper` text.
- Three.js and SVG cannot read CSS variables. `NA_COLOR` and `gl.setClearColor` in
  `app/dashboards/gym/panels/BodyDiagram.tsx` must match `--color-rule-soft`.

## CSS precedence in Next.js 15

Next.js 15 orders stylesheets by `data-precedence`. Page-level CSS modules load before the root
bundle, so equal-specificity page rules can lose to component rules. Do not override a component
default from a page module by source order. Add a component prop, such as `rule={false}`, when a
page needs a different supported visual.

## Copy and accessibility

- All site copy and touched documentation must be ASCII-only. `npm run check:ascii` enforces this
  for tracked source, content, style, documentation, script, and SQL files.
- Do not use em or en dashes, smart quotes, ellipsis characters, arrows, interpuncts, or emoji.
  Use straight quotes, three periods, ASCII punctuation, and ` / ` for metadata separators.
- Keep copy first-person, specific, and plain. Avoid buzzwords, hedges, "passionate", and "leverage".
- Maintain WCAG 2.1 AA contrast, keyboard operation, semantic heading order, a visible 2px accent
  focus outline, reduced motion, and the 320px minimum layout.
