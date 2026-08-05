# Data With Dillon: Portfolio

Personal portfolio and project hub for Dillon Shearer. Deployed at
[datawithdillon.com](https://datawithdillon.com).

## Stack

- **Framework:** Next.js 15 App Router with Turbopack
- **Language:** TypeScript and React 19
- **Styling:** CSS Modules and design tokens in `styles/tokens.css`; no Tailwind or UI library
- **Fonts:** Schibsted Grotesk, Inter, and JetBrains Mono via `next/font/google`
- **Data:** Neon Postgres through `@vercel/postgres` for the gym dashboard
- **Charts and 3D:** Recharts, React Three Fiber, and drei
- **AI:** OpenAI Chat Completions for the gym chat assistant
- **Email:** Resend API through direct fetch
- **Quality:** ESLint, `npm run check:ascii`, and GitHub Actions CI
- **Deployment:** Vercel

## Local development

```bash
npm install
copy .env.example .env.local # Windows PowerShell or cmd
npm run dev                  # http://localhost:3000
npm run lint
npm run check:ascii
npx tsc --noEmit
```

The CI workflow also runs `npm run build` with dummy environment values.

## Content editing

Most site copy is structured data in `content/`, not page JSX. To add a project,
edit `content/dashboards.ts`. Navigation, site metadata, and social links live in
`content/site.ts`; edit that file when changing the shared navigation.

## Repo layout

```text
app/                        Next.js App Router routes and API handlers
  dashboards/gym/           Gym tracker, forms, charts, and 3D panels
  koreader-remote/          Hidden full-bleed KOReader utility
  rss/                      RSS feed and feed endpoint
components/
  ui/                       Shared UI primitive exports
  dashboard/                Dashboard framework components
content/                    Structured site and page content
db/migrations/              One-shot SQL migrations
docs/                       Design spec and feature-parity reference
scripts/                    Repository utilities, including ASCII validation
styles/tokens.css           Single source of truth for design tokens
.claude/                    Agent guidance and style rules
.github/workflows/ci.yml    CI checks
```

## Environment

Copy `.env.example` to `.env.local` and replace every placeholder with the
appropriate local or deployed value. The example documents the public site URL,
Resend key, database connections, gym chat settings, and workout password.

## Design system

- Tokens: `styles/tokens.css`
- Primitives: `components/ui/`
- Operational UI rules: `.claude/STYLE.md`
- Agent guidance and gotchas: `.claude/AGENTS.md` and `CLAUDE.md`
- Locked design rationale: `docs/design-spec.md`

## Deployment

Push to `main`. Vercel auto-deploys. Environment variables are managed in the
Vercel project settings.
