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

---

## Session 2 — 2026-05-27: Build complete + post-build fixes

### What was built

All 22 plan tasks executed. The site is fully scaffolded and builds clean. Routes:

| Path | Status |
|---|---|
| `/` | Home — hero, capabilities cards, Currently |
| `/about` | Bio, 2 resume cards, certifications |
| `/contact` | Server Action form + Elsewhere widgets |
| `/rss` | Human-readable RSS page (not in nav) |
| `/rss/feed` | RSS 2.0 XML feed |
| `/*` | 404 |

### Key deviations from the plan

- `create-next-app` installed v16 by default; pinned to `create-next-app@15` to get Next.js 15
- Scaffold failed on non-empty directory; HANDOFF.md, docs/, .claude/ were temporarily moved out and restored after
- `Button.module.css` had `border-radius: 0` (caught by acceptance grep); removed (browser default)
- Email HTML body had `#f5f5f5` hex (caught by acceptance grep); replaced with named CSS color

### Post-build fixes applied

1. **Rule overuse** — removed explicit `<Rule>` from inside About page sections. Sections now use hairline `border-top` + `padding-top` on `.section`. Card's own `border-top: medium` serves as the visual section opener. Eliminates double-line stacking.

2. **Comprehensive resume removed** — About page now has 2 resume cards (Data Engineer, Data Analyst). Both link to the same PDF until role-specific files are ready.

3. **No em/en dashes** — all em (—) and en (–) dashes removed from `app/`, `components/`, `STYLE.md`, `AGENTS.md`, `README.md`. Rule added to STYLE.md Punctuation section and AGENTS.md Forbidden list. Use commas or colons instead. Hyphens in compound modifiers (e.g. "data-centric") are fine.

4. **Contact Elsewhere widgets** — replaced plain inline links with a labeled 3-column grid. Each contact method has an uppercase sans label ("Email", "LinkedIn", "GitHub") and a serif accent-colored link. Stacks to 1 column on mobile.

5. **RSS routing fix** — `/rss` is now the human-readable page (`app/rss/page.tsx`). XML feed moved to `/rss/feed` (`app/rss/feed/route.ts`). Eliminated the issue of the nav link serving raw XML.

6. **RSS removed from nav** — RSS tab removed from Header, MobileDrawer, and Footer. `/rss` and `/rss/feed` still exist and are reachable by direct URL.

### Current nav (3 items)

Home · About · Contact

### Updated hard constraints

- No em dashes (—) or en dashes (–) anywhere in site copy
- Nav has exactly 3 items (RSS removed)

### Current state

`npm run build` passes clean. All 5 acceptance grep checks still return zero matches. `.env.local` is present with `RESEND_API_KEY` and `NEXT_PUBLIC_SITE_URL`.
