# ds-portfolio Design Spec
**Date:** 2026-05-27
**Status:** Approved

---

## Overview

A brand-new Next.js 15 (App Router) portfolio for Dillon Shearer, deployed on Vercel at **datawithdillon.com**. Editorial print aesthetic — quiet, confident, type-led. No AI tropes, no glassmorphism, no neon.

Built in: `/Users/dillon/Desktop/projects/ds-portfolio`
Content source: existing site code at `/Users/dillon/Desktop/projects/dillon-shearer-website/app/`

---

## Constraints

- No Tailwind, no UI libraries, no animation libraries
- Dependencies: `next`, `react`, `react-dom`, `next/font`, `resend` (approved for contact form)
- No dark mode in v1
- No raw hex/rgb outside `tokens.css`
- No `font-family` declarations outside `tokens.css`
- No `border-radius` > 2px
- No `box-shadow` on UI elements
- No gradient backgrounds
- No emoji in nav, headers, or buttons
- One accent color only (`--color-accent` oxblood)

---

## Project Structure

```
ds-portfolio/
├── app/
│   ├── layout.tsx                  # root layout: fonts, Header, Footer
│   ├── page.tsx                    # / Home
│   ├── about/page.tsx              # /about
│   ├── contact/page.tsx            # /contact
│   ├── rss/
│   │   ├── route.ts                # RSS 2.0 XML feed
│   │   └── about/page.tsx          # human-readable RSS explanation
│   ├── api/contact/route.ts        # Resend serverless handler
│   └── not-found.tsx               # 404 with link to Home
├── components/ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Rule.tsx
│   ├── PageHeader.tsx
│   ├── Table.tsx
│   ├── CodeBlock.tsx
│   ├── Link.tsx                    # InlineLink + NavLink variants
│   ├── Input.tsx
│   └── README.md
├── components/
│   ├── Header.tsx                  # sticky, wordmark + nav, hamburger mobile
│   ├── Footer.tsx                  # three-column, hairline top
│   └── MobileDrawer.tsx            # right-slide, focus trap, ESC/backdrop close
├── styles/
│   └── tokens.css                  # single source of truth for all design tokens
├── public/
│   └── resumes/                    # role-specific PDFs (owner drops files here)
├── docs/superpowers/specs/         # this file
├── STYLE.md
├── AGENTS.md
└── README.md
```

---

## Design System

### Tokens (`styles/tokens.css`)

Single source of truth. Full token set:

```css
:root {
  /* Paper & ink */
  --color-paper:        #F7F3EC;
  --color-paper-2:      #FAF6EF;
  --color-ink:          #1B1814;
  --color-ink-2:        #4A4239;
  --color-ink-3:        #8A7F71;
  --color-rule:         #D8CFC2;
  --color-rule-soft:    #EBE3D5;

  /* Accent (oxblood) */
  --color-accent:       #7A2E2E;
  --color-accent-hover: #5C2020;
  --color-accent-soft:  #F1E4E1;

  /* Status */
  --color-positive:     #4A6B3A;
  --color-warn:         #B8893B;

  /* Typography */
  --font-serif: "Source Serif 4", Georgia, "Times New Roman", serif;
  --font-sans:  "IBM Plex Sans", system-ui, -apple-system, sans-serif;
  --font-mono:  "IBM Plex Mono", ui-monospace, "Menlo", monospace;

  /* Type scale */
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-md:   1.125rem;
  --text-lg:   1.25rem;
  --text-xl:   1.5rem;
  --text-2xl:  1.875rem;
  --text-3xl:  2.25rem;
  --text-4xl:  3rem;

  /* Leading */
  --leading-tight:  1.2;
  --leading-snug:   1.35;
  --leading-normal: 1.55;
  --leading-loose:  1.75;

  /* Tracking */
  --tracking-tight: -0.01em;
  --tracking-wide:   0.08em;

  /* Spacing (4px scale) */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 24px;  --space-6: 32px;
  --space-7: 48px;  --space-8: 64px;  --space-9: 96px;

  /* Layout */
  --content-width:      680px;
  --content-width-wide: 1080px;
  --gutter:             var(--space-5);

  /* Radii (resist the urge) */
  --radius-sm: 2px;
  --radius-md: 2px;

  /* Border weights */
  --rule-hairline: 1px;
  --rule-medium:   2px;

  /* Motion */
  --ease-out:      cubic-bezier(0.2, 0.7, 0.2, 1);
  --duration-fast: 120ms;
  --duration:      180ms;
}
```

### Fonts

Loaded via `next/font/google` in `app/layout.tsx`. Three faces, latin subset, `display: swap`. `next/font` generates CSS variables; `tokens.css` maps them to `--font-serif`, `--font-sans`, `--font-mono`. No `font-family` declaration anywhere else.

### Typography Rules

| Element | Font | Size | Weight | Leading | Case | Tracking |
|---|---|---|---|---|---|---|
| H1 (page title) | serif | 4xl | 400 | tight | sentence | tight |
| H2 | serif | 3xl | 400 | tight | sentence | tight |
| H3 | serif | xl | 500 | snug | sentence | tight |
| Body prose | serif | md | 400 | loose | sentence | normal |
| Lead paragraph | serif | lg | 400 | normal | sentence | normal |
| Nav links / UI labels | sans | sm | 500 | snug | UPPERCASE | wide |
| Eyebrow / metadata | sans | xs | 400 | snug | UPPERCASE | wide |
| Inline code | mono | sm | 400 | normal | as-is | normal |
| Pull quote | serif italic | xl | 400 | snug | sentence | tight |

Body prose max-width: 60–75ch. Hyphenation on. `hanging-punctuation: first last`.

### UI Primitives

Eight primitives in `components/ui/`. No others without updating `STYLE.md` first.

**Button** — variants: `primary` (ink fill, cream label, hover → accent), `outline` (ink border, hover → ink fill), `ghost` (underlined label, tertiary only). Square corners. No shadow.

**Link** — variants: `inline` (accent color, always underlined, hover deepens), `nav` (sans-uppercase, no underline at rest, 2px bottom rule animates in on hover).

**Card** — no shadow, no fill. `--rule-medium` ink top + `--rule-hairline` rule-color bottom. Padding `--space-5 0`. Structure: eyebrow → H3 → description → optional badges (max 3).

**Input** — bottom rule only. Label above. Focus: rule → medium accent. Used on contact form only.

**Badge** — sans-uppercase-xs, 1px hairline border, no fill. Max 3 per card.

**Rule** — 1px `--color-rule`, full width. Used liberally as section separator.

**PageHeader** — eyebrow → H1 → lead paragraph → Rule medium.

**Table** — top/bottom medium rules, hairline below header. No zebra, no vertical rules.

**CodeBlock** — `--color-paper-2` background, `--rule-medium` left rule, mono sm.

---

## Layout

### Page Shell

- Background: `--color-paper`
- Prose pages (Home, About, Contact, RSS/about): max-width `--content-width` (680px)
- Horizontal padding: `--gutter` mobile → `--space-7` at ≥900px

### Header

- Height: 56px mobile / 64px desktop
- Sticky. No shrink, blur, shadow, or transparency change on scroll.
- Left: wordmark "Data With Dillon" — serif, sm, uppercase, tracking-wide → routes to `/`
- Right ≥720px: inline nav — Home · About · Contact · RSS
- Right <720px: hamburger (three lines → X when open)
- Hairline bottom rule

### Mobile Drawer

- Slides from right, full height, ~80% viewport width
- Cream background, hairline left edge
- Nav items stacked, sans-uppercase-sm, `--space-5` vertical
- Backdrop: `--color-ink` at 40% opacity
- Close: tap outside, X button, or ESC
- 180ms slide + fade. Focus trap. Restores focus on close.

### Footer

- Hairline top rule, padding `--space-7 0`
- Three columns desktop / single column mobile: Navigate | Elsewhere | Connect
- Navigate: Home · About · Contact · RSS
- Elsewhere: GitHub (this site's source) · Personal GitHub · LinkedIn
- Connect: email link
- Below: copyright + "View Source" + "Built with Next.js" in sans-xs `--color-ink-3`

---

## Routes

**4 routes. No others.**

| Route | Content |
|-------|---------|
| `/` | Hero (name H1, role descriptor, value prop lead, 2 CTAs) → "What I Do" cards → "Currently" line |
| `/about` | PageHeader → bio prose → Resumes section (Card list + download buttons) → Certifications section (Card list) |
| `/contact` | PageHeader → intro → form (Name, Email, Message) → Rule → email/LinkedIn/GitHub links |
| `/rss` | RSS 2.0 XML feed (application/xml) |
| `/rss/about` | Human-readable RSS explanation page |

**Old paths** (`/blog`, `/demos`, `/notebooks`, `/certifications`, `/jupyter`, `/resumes`, `/work`, `/writing`, `/koreader-remote`, etc.) → Next.js `not-found()`. Single link back to Home. No redirects.

### Page Details

**`/` Home**
- Hero: name (H1 4xl serif), role (sans-uppercase-sm), value prop (lead serif lg)
- CTAs: `Button.primary` → `/contact`, `Button.outline` → `/about`
- Rule medium
- "What I Do": H2 + 3–4 Cards (capabilities from existing site)
- Rule medium
- "Currently": one sentence, sans-sm `--color-ink-2`

**`/about`**
- PageHeader: eyebrow "About", title "Dillon Shearer", lead from existing About
- Bio prose (existing content, lightly trimmed)
- "Resumes" section: H2 + intro + Card list with `Button.outline` download links. PDFs in `public/resumes/`.
- "Certifications" section: H2 + intro + Card list (date, issuer, name per card)

**`/contact`**
- PageHeader: eyebrow "Contact", title "Get in touch"
- Lead paragraph (1–2 sentences from existing Contact)
- Form: Name, Email, Message → posts to `/api/contact`
- `Button.primary` submit
- Rule → email link, LinkedIn, GitHub

**`/api/contact`**
- Serverless route. Receives `{ name, email, message }`.
- Server-side validation (non-empty, valid email format).
- Sends via Resend. Ported directly from existing site logic.

**`/rss`**
- Valid RSS 2.0 XML. Content-Type: `application/xml`.
- Single `<channel>` for site updates. One initial item: "Site launched."
- Must validate against W3C feed validator.

**`/rss/about`**
- PageHeader: eyebrow "Subscribe", title "RSS Feed"
- Explains what RSS is, how to subscribe, links to popular readers.

**`/not-found`**
- Minimal. H2 "Page not found." One sentence. Link back to Home.

---

## Breakpoints

Three only:
- `<720px` — mobile (default)
- `≥720px` — tablet (header nav expands, hamburger retires)
- `≥1080px` — desktop (max content widths apply)

---

## Implementation Strategy (Hybrid Option C)

### Phase 1 — Parallel

Three independent agents run simultaneously:
1. **Scaffold**: `create-next-app` (no Tailwind, TypeScript, App Router), strip defaults, configure `next.config.js`, `globals.css`
2. **Tokens + docs**: write `tokens.css`, `STYLE.md`, `AGENTS.md`, `README.md`
3. **Content**: read existing pages from `/dillon-shearer-website/app/` and produce a structured content manifest (bio, certifications, "What I Do" copy, contact details, taglines)

### Phase 2 — Sequential

1. UI primitives (all 8 + `README.md`)
2. Shell: `Header`, `Footer`, `MobileDrawer`, root `layout.tsx`
3. Pages: Home → About → Contact → RSS → 404
4. API route (`/api/contact`)
5. Acceptance checklist pass

---

## Acceptance Criteria

**Design integrity**
- [ ] No hex/rgb outside `tokens.css`
- [ ] No `font-family` outside `tokens.css`
- [ ] No `border-radius` > 2px
- [ ] No `box-shadow` on UI elements
- [ ] No gradient backgrounds
- [ ] No emoji in nav, headers, buttons
- [ ] One accent color only

**Layout & nav**
- [ ] Nav has exactly 4 items: Home, About, Contact, RSS
- [ ] Header sticky; no shrink, blur, shadow, or transparency change on scroll
- [ ] Mobile drawer: opens, closes via X/backdrop/ESC, traps focus, restores focus
- [ ] Prose pages max 680px wide

**Routes**
- [ ] Exactly 4 routes + `/rss/about` + `/api/contact` + `not-found`
- [ ] Old paths return 404 with link to Home
- [ ] Resumes downloadable from About
- [ ] Certifications listed on About
- [ ] RSS validates as RSS 2.0

**Content**
- [ ] Copy sourced from existing site, trimmed but not rewritten
- [ ] Voice matches source

**Performance & accessibility**
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95
- [ ] Renders correctly at 360px, 720px, 1080px, 1440px
- [ ] Tab order logical; all interactive elements keyboard-reachable
- [ ] WCAG AA color contrast

**Documentation**
- [ ] `STYLE.md`, `AGENTS.md`, `tokens.css`, `components/ui/README.md` present and current
- [ ] Root `README.md`: stack, local dev, deploy, design system location
