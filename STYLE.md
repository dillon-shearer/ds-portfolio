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

## Hard Rules

- No `border-radius` > 2px
- No `box-shadow` on UI elements
- No gradient backgrounds
- No emoji in nav, headers, or buttons
- One accent color: `--color-accent` (oxblood)
- Depth via rules and whitespace, never shadows
