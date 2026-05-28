# Agent Handoff — ds-portfolio

## What this is

A brand-new Next.js 15 portfolio for Dillon Shearer at **datawithdillon.com**. Print-editorial aesthetic — cream/ink palette, oxblood accent, serif-led type, no Tailwind, no UI libraries, no shadows, no gradients, no rounded cards.

## Current state

- **Directory:** `/Users/dillon/Desktop/projects/ds-portfolio` — **completely empty**, nothing scaffolded yet
- **Design spec:** `docs/superpowers/specs/2026-05-27-ds-portfolio-design.md` — approved by owner
- **Implementation plan:** `docs/superpowers/plans/2026-05-27-ds-portfolio.md` — 22 tasks, ready to execute
- **Nothing has been built yet.** Your job is to execute the plan start to finish.

## Execute the plan

Read the plan at `docs/superpowers/plans/2026-05-27-ds-portfolio.md` and execute all 22 tasks in order.

Tasks 1–3 are noted as parallel (no dependencies between them). Tasks 4–22 must run sequentially.

The plan has complete, copy-paste-ready code for every step. Do not improvise — follow it exactly.

## Key decisions already made (do not revisit)

| Decision | Choice |
|---|---|
| Build location | `/Users/dillon/Desktop/projects/ds-portfolio` (empty) |
| Analytics page | **Excluded** — 4 routes only (Home, About, Contact, RSS) |
| Contact form | Server Actions (`app/contact/actions.ts`) with direct Resend API fetch — no SDK |
| Email service | Resend, direct fetch to `https://api.resend.com/emails` — no `resend` npm package |
| CSS approach | CSS Modules per component + `styles/tokens.css` global tokens |
| Dark mode | None in v1 |
| Nav items | Home · About · Contact · RSS (4 only) |

## Content source

Read text content from the **existing site's source code** — do not copy any code, styles, or components from it. Only extract prose.

- `/Users/dillon/Desktop/projects/dillon-shearer-website/app/page.tsx` — home copy
- `/Users/dillon/Desktop/projects/dillon-shearer-website/app/about/page.tsx` — bio copy
- `/Users/dillon/Desktop/projects/dillon-shearer-website/lib/resume-data.ts` — certifications list
- `/Users/dillon/Desktop/projects/dillon-shearer-website/app/contact/actions.ts` — Resend logic (port directly)

## Environment variables

Copy from `/Users/dillon/Desktop/projects/dillon-shearer-website/.env.local`:

```
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Create `.env.local` in `ds-portfolio/` with these values before testing the contact form.

## Hard constraints (enforced in acceptance checklist, Task 22)

- No hex/rgb values outside `styles/tokens.css`
- No `font-family` declarations outside `styles/tokens.css`
- No `border-radius` > 2px
- No `box-shadow` on UI elements
- No gradient backgrounds
- No emoji in nav, headers, or buttons
- One accent color only (`--color-accent`)
- Nav has exactly 4 items

## Files to read before touching anything

1. `docs/superpowers/specs/2026-05-27-ds-portfolio-design.md` — full design spec
2. `docs/superpowers/plans/2026-05-27-ds-portfolio.md` — implementation plan (your primary guide)

## Done when

All 22 tasks are complete, `npm run build` succeeds with no errors, and the acceptance checklist in Task 22 passes (all five grep checks return zero matches).
