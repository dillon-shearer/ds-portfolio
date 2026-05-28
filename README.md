# Data With Dillon: Portfolio

Personal portfolio for Dillon Shearer. Deployed at [datawithdillon.com](https://datawithdillon.com).

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** CSS Modules + `styles/tokens.css` (no Tailwind, no UI library)
- **Fonts:** Source Serif 4 · IBM Plex Sans · IBM Plex Mono via `next/font/google`
- **Email:** Resend API (direct fetch, no SDK)
- **Deployment:** Vercel

## Local dev

```bash
npm install
npm run dev       # http://localhost:3000
```

## Deployment

Push to `main`. Vercel auto-deploys. Requires env var:

```
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=https://datawithdillon.com
```

## Design system

- Tokens: `styles/tokens.css`
- Components: `components/ui/`
- Rules: `STYLE.md`
- Agent guidance: `AGENTS.md`

## Routes

| Path | Purpose |
|------|---------|
| `/` | Home |
| `/about` | Bio, resumes, certifications |
| `/contact` | Contact form |
| `/rss` | RSS 2.0 XML feed |
| `/rss/about` | Human-readable RSS explanation |

All other paths return 404.
