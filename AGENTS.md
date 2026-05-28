# AGENTS.md — Working in This Codebase

## Read order (required before every task)

1. `STYLE.md` — design system
2. `AGENTS.md` — this file
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

## Forbidden without explicit user approval

- Adding npm dependencies
- Adding routes
- Adding analytics providers

## Required for every PR

- Screenshot at 360px and 1440px for every page touched
- Confirm all colors, fonts, and spacing reference `var(--*)` — no hardcoded values
- Confirm no `border-radius` > 2px, no `box-shadow`, no gradient backgrounds

## When in doubt

Ask, don't invent. Match an existing pattern before creating a new one.

## Out of scope without explicit instruction

- Rewriting copy
- Adding nav items
- Adding pages
- Restoring /blog, /demos, /notebooks content
