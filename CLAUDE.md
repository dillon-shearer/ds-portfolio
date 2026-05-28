# Data With Dillon — Portfolio

Next.js 15 App Router · TypeScript · CSS Modules · Vercel

## Commands

```bash
npm run dev        # dev server at http://localhost:3000
npm run build      # production build (also used for type-check — no test framework)
```

## Required env vars

```
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=https://datawithdillon.com
```

## Required env vars (gym dashboard)

```
DATABASE_URL=<Neon pooled connection>
DATABASE_URL_UNPOOLED=<Neon direct connection>
GYM_CHAT_DATABASE_URL_READONLY=<Neon readonly>
OPENAI_API_KEY=<OpenAI key for gym chat>
LIFT_PASSWORD=<password for Log Workout tab>
```

## Key files

- `.claude/STYLE.md`   — design system rules (read before any UI work)
- `.claude/AGENTS.md`  — agent-specific rules and gotchas (read before any task)
- `styles/tokens.css`  — all design tokens (colors, spacing, type scale)
- `components/ui/`     — UI primitives (no new ones without updating .claude/STYLE.md)
- `components/dashboard/` — dashboard framework primitives (see .claude/STYLE.md)

## Architecture

```
app/             Next.js App Router pages
components/ui/   Shared UI primitives (Button, Card, PageHeader, DashboardCard, ...)
components/      Layout components (Header, Footer, MobileDrawer)
styles/          tokens.css only — all other styles are CSS Modules co-located with components
.claude/         Agent guidance (STYLE.md, AGENTS.md, HANDOFF.md)
```

## Routes

| Path | Purpose |
|---|---|
| `/` | Home |
| `/about` | Bio, resumes, certifications |
| `/contact` | Contact form (Resend API) |
| `/dashboards` | Dashboard list |
| `/dashboards/coming-soon` | Placeholder for unhosted dashboards |
| `/dashboards/gym` | Gym tracker dashboard (analytics, log workout, AI chat) |
| `/rss` | RSS feed |

## Gotchas

- **Nav changes:** update BOTH `components/Header.tsx` AND `components/MobileDrawer.tsx` — they have separate `NAV_ITEMS` arrays
- **CSS precedence:** page-level CSS modules load before the root bundle in Next.js 15 — page-level overrides silently lose to component rules. Use component props instead. See `.claude/STYLE.md`.
- No `border-radius` > 2px, no `box-shadow`, no gradients — see `.claude/STYLE.md`
- No em dashes or en dashes anywhere in copy
