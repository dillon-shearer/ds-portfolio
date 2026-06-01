# Data With Dillon: Portfolio

Personal portfolio and project hub for Dillon Shearer. Deployed at [datawithdillon.com](https://datawithdillon.com).

## Stack

- **Framework:** Next.js 15 (App Router) on Turbopack
- **Language:** TypeScript, React 19
- **Styling:** CSS Modules + design tokens in `styles/tokens.css` (no Tailwind, no UI library)
- **Fonts:** Source Serif 4 · IBM Plex Sans · IBM Plex Mono via `next/font/google`
- **Data:** Neon Postgres via `@vercel/postgres` (gym dashboard)
- **Charts / 3D:** Recharts · React Three Fiber + drei
- **AI:** OpenAI Chat Completions (gym chat assistant)
- **Email:** Resend API (direct fetch, no SDK)
- **Deployment:** Vercel

## Local dev

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # also acts as type-check; no test framework
```

## Repo layout

```
app/                        Next.js App Router routes
  about/                    Bio, resumes, certifications
  contact/                  Contact form (Resend)
  dashboards/               Dashboard list page
    coming-soon/            Placeholder for unhosted dashboards
    gym/                    Gym tracker (analytics, log workout, AI chat)
      panels/               Recharts and R3F panel components
  koreader-remote/          Hidden full-bleed utility (KOReader page-turn remote)
  api/
    gym-chat/               OpenAI-backed chat over the lift database
    gym-data/               JSON + CSV export endpoints (auth-free by design)
  rss/                      RSS 2.0 feed

components/
  ui/                       Shared primitives (Button, Card, PageHeader, DashboardCard, ...)
  dashboard/                Dashboard framework (Shell, Panel, StatWidget, FloatingChatWidget, ...)
  Header.tsx, Footer.tsx, SiteChrome.tsx, MobileDrawer.tsx

lib/
  gym-chat/                 SQL policy, semantics, capabilities, catalog, error enrichment

db/
  migrations/               One-shot SQL files (YYYY-MM-DD-name.sql)

styles/
  tokens.css                Single source of truth for color, spacing, type scale

public/                     Static assets
docs/superpowers/           Specs and execution plans (specs/, plans/)
.claude/                    Agent guidance (STYLE.md, AGENTS.md, HANDOFF.md)
```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Home |
| `/about` | Bio, resumes, certifications |
| `/contact` | Contact form |
| `/dashboards` | Dashboard list |
| `/dashboards/coming-soon` | Placeholder card target |
| `/dashboards/gym` | Gym tracker — analytics, workout logging, AI chat |
| `/koreader-remote` | Hidden full-bleed utility; not linked from nav |
| `/rss`, `/rss/feed` | RSS 2.0 feed |

## Environment

Required for the public site:

```
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=https://datawithdillon.com
```

Additionally required for the gym dashboard:

```
DATABASE_URL=<Neon pooled connection>
DATABASE_URL_UNPOOLED=<Neon direct connection>
GYM_CHAT_DATABASE_URL_READONLY=<Neon readonly role>
OPENAI_API_KEY=<OpenAI key for gym chat>
LIFT_PASSWORD=<password for the Log Workout tab>
```

## Design system

- Tokens: `styles/tokens.css`
- Primitives: `components/ui/`
- Rules and conventions: `.claude/STYLE.md`
- Agent guidance and gotchas: `.claude/AGENTS.md`, `CLAUDE.md`

## Deployment

Push to `main`. Vercel auto-deploys. Environment variables are managed in the Vercel project settings.
