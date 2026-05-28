# AGENTS.md: Working in This Codebase

## Read order (required before every task)

1. `STYLE.md` (design system)
2. `AGENTS.md` (this file)
3. The specific component(s) your task touches
4. The task description

## Forbidden without updating STYLE.md first

- New colors (beyond tokens.css)
- New fonts
- New border-radius values
- New box-shadows
- New breakpoints
- New component variants
- New layout primitives
- Em dashes (—) or en dashes (–) in copy: use commas or colons instead

## Forbidden without explicit user approval

- Adding npm dependencies
- Adding routes
- Adding analytics providers

## Required for every PR

- Screenshot at 360px and 1440px for every page touched
- Confirm all colors, fonts, and spacing reference `var(--*)` (no hardcoded values)
- Confirm no `border-radius` > 2px, no `box-shadow`, no gradient backgrounds

## When in doubt

Ask, don't invent. Match an existing pattern before creating a new one.

## Known gotchas

- Nav changes require updating BOTH `components/Header.tsx` AND `components/MobileDrawer.tsx` — they have separate `NAV_ITEMS` arrays
- No test framework — verify correctness with `npm run build`
- CSS precedence: page-level module CSS loads before the root bundle in Next.js 15; page overrides silently lose to component rules. See STYLE.md "CSS Precedence" section.

## Out of scope without explicit instruction

- Rewriting copy
- Adding nav items
- Adding pages
- Restoring /blog, /demos, /notebooks content
