# ds-portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clean-slate Next.js 15 portfolio at `/Users/dillon/Desktop/projects/ds-portfolio` with a print-editorial aesthetic, 4 routes, and zero dependencies beyond next/react/next-font plus the Resend API (used directly via fetch, no SDK).

**Architecture:** App Router, TypeScript, no Tailwind. All design tokens in `styles/tokens.css`. All UI from 8 hand-built primitives in `components/ui/`. Contact form uses Next.js Server Actions with direct Resend API fetch — no SDK.

**Tech Stack:** Next.js 15, React 19, TypeScript, next/font/google (Source Serif 4 · IBM Plex Sans · IBM Plex Mono), CSS Modules, Resend API via native fetch.

**Content source:** Read existing pages from `/Users/dillon/Desktop/projects/dillon-shearer-website/app/` — do not copy code, only extract text content.

**Working directory for all commands:** `/Users/dillon/Desktop/projects/ds-portfolio`

---

## Phase 1 — Parallel tasks (Tasks 1–3 have no dependencies, run simultaneously)

---

### Task 1: Scaffold Next.js 15 project

**Files:**
- Create: all scaffold files via `create-next-app`
- Replace: `app/globals.css` (strip defaults)
- Delete: `public/next.svg`, `public/vercel.svg`

- [ ] **Step 1: Scaffold**

```bash
cd /Users/dillon/Desktop/projects/ds-portfolio
npx create-next-app@latest . --typescript --no-tailwind --app --no-src-dir --no-eslint --import-alias "@/*"
```

When prompted, accept defaults for everything (the flags above override the key choices).

- [ ] **Step 2: Verify scaffold succeeded**

```bash
ls app/ && cat package.json | grep '"next"'
```

Expected: `app/` directory exists, next version is 15.x.

- [ ] **Step 3: Replace `app/globals.css` with minimal reset**

Replace the entire file content with:

```css
/* Base reset — tokens loaded separately via layout.tsx import */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  background-color: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: inherit;
  line-height: inherit;
}

p {
  hyphens: auto;
  hanging-punctuation: first last;
}

img, video {
  max-width: 100%;
  height: auto;
  display: block;
}

a {
  color: inherit;
}

button {
  font: inherit;
  cursor: pointer;
}

/* Page wrapper — used by all prose pages */
.page-wrapper {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-8) var(--gutter);
}

@media (min-width: 720px) {
  .page-wrapper {
    padding-left: var(--space-7);
    padding-right: var(--space-7);
  }
}
```

- [ ] **Step 4: Delete default public assets**

```bash
rm -f public/next.svg public/vercel.svg
```

- [ ] **Step 5: Replace `next.config.ts` with minimal config**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

- [ ] **Step 6: Create the styles directory and stub tokens.css**

```bash
mkdir -p styles
touch styles/tokens.css
```

(Tokens will be filled in Task 2.)

- [ ] **Step 7: Create component directories**

```bash
mkdir -p components/ui
mkdir -p public/resumes
```

- [ ] **Step 8: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js 15 project, reset globals.css"
```

---

### Task 2: Write styles/tokens.css

**Files:**
- Create: `styles/tokens.css`

- [ ] **Step 1: Write the token file**

```css
/* ==========================================================
   Design Tokens — single source of truth
   All colors, fonts, spacing, and motion live here.
   No hex/rgb values anywhere else in the codebase.
   ========================================================== */

:root {
  /* ---------- Paper & ink ---------- */
  --color-paper:        #F7F3EC;
  --color-paper-2:      #FAF6EF;
  --color-ink:          #1B1814;
  --color-ink-2:        #4A4239;
  --color-ink-3:        #8A7F71;
  --color-rule:         #D8CFC2;
  --color-rule-soft:    #EBE3D5;

  /* ---------- Accent (oxblood) ---------- */
  --color-accent:       #7A2E2E;
  --color-accent-hover: #5C2020;
  --color-accent-soft:  #F1E4E1;

  /* ---------- Status ---------- */
  --color-positive:     #4A6B3A;
  --color-warn:         #B8893B;

  /* ---------- Typography ---------- */
  /* next/font injects these variables on <html>; tokens.css maps them. */
  --font-serif: var(--next-font-serif), Georgia, "Times New Roman", serif;
  --font-sans:  var(--next-font-sans), system-ui, -apple-system, sans-serif;
  --font-mono:  var(--next-font-mono), ui-monospace, "Menlo", monospace;

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

  /* ---------- Spacing (4px scale) ---------- */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;

  /* ---------- Layout ---------- */
  --content-width:      680px;
  --content-width-wide: 1080px;
  --gutter:             var(--space-5);

  /* ---------- Radii ---------- */
  --radius-sm: 2px;
  --radius-md: 2px;

  /* ---------- Border weights ---------- */
  --rule-hairline: 1px;
  --rule-medium:   2px;

  /* ---------- Motion ---------- */
  --ease-out:      cubic-bezier(0.2, 0.7, 0.2, 1);
  --duration-fast: 120ms;
  --duration:      180ms;
}
```

- [ ] **Step 2: Commit**

```bash
git add styles/tokens.css
git commit -m "feat: add design tokens (tokens.css)"
```

---

### Task 3: Write STYLE.md, AGENTS.md, README.md

**Files:**
- Create: `STYLE.md`
- Create: `AGENTS.md`
- Create: `README.md`

- [ ] **Step 1: Write `STYLE.md`**

```markdown
# Style Guide — Data With Dillon

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
| Card | Card.tsx | — | Certs, resumes, capabilities | Cards within cards |
| Input | Input.tsx | input, textarea | Contact form only | — |
| Badge | Badge.tsx | — | Skill tags, status | More than 3 per card |
| Rule | Rule.tsx | hairline, medium | Section dividers | Decorative |
| PageHeader | PageHeader.tsx | — | Every page top | Mid-page headings |
| Table | Table.tsx | — | Tabular data | Layout |
| CodeBlock | CodeBlock.tsx | — | Code samples | Long prose |

## Layout

- Prose pages: `max-width: var(--content-width)` (680px)
- Horizontal padding: `var(--gutter)` mobile → `var(--space-7)` at ≥720px
- Use `.page-wrapper` class from `globals.css`

## Breakpoints

- `<720px` — mobile (default)
- `≥720px` — tablet (header nav expands)
- `≥1080px` — desktop (max widths apply)

No other breakpoints without updating this file.

## Hard Rules

- No `border-radius` > 2px
- No `box-shadow` on UI elements
- No gradient backgrounds
- No emoji in nav, headers, or buttons
- One accent color: `--color-accent` (oxblood)
- Depth via rules and whitespace, never shadows
```

- [ ] **Step 2: Write `AGENTS.md`**

```markdown
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
```

- [ ] **Step 3: Write `README.md`**

```markdown
# Data With Dillon — Portfolio

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
```

- [ ] **Step 4: Commit**

```bash
git add STYLE.md AGENTS.md README.md
git commit -m "feat: add STYLE.md, AGENTS.md, README.md"
```

---

## Phase 2 — Sequential (must run in order after Phase 1 completes)

---

### Task 4: Rule + Badge primitives

**Files:**
- Create: `components/ui/Rule.tsx`
- Create: `components/ui/Badge.tsx`

- [ ] **Step 1: Write `components/ui/Rule.tsx`**

```tsx
interface RuleProps {
  weight?: 'hairline' | 'medium'
}

export function Rule({ weight = 'hairline' }: RuleProps) {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: `var(--rule-${weight}) solid var(--color-rule)`,
        margin: 0,
        width: '100%',
      }}
    />
  )
}
```

- [ ] **Step 2: Write `components/ui/Badge.tsx`**

```tsx
interface BadgeProps {
  children: React.ReactNode
}

export function Badge({ children }: BadgeProps) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-xs)',
        fontWeight: 400,
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wide)',
        lineHeight: 'var(--leading-snug)',
        border: 'var(--rule-hairline) solid var(--color-rule)',
        padding: '2px var(--space-2)',
        display: 'inline-block',
        color: 'var(--color-ink-2)',
      }}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Rule.tsx components/ui/Badge.tsx
git commit -m "feat: add Rule and Badge primitives"
```

---

### Task 5: Button primitive

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Button.module.css`

- [ ] **Step 1: Write `components/ui/Button.module.css`**

```css
.button {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-snug);
  padding: var(--space-3) var(--space-5);
  border-radius: 0;
  cursor: pointer;
  display: inline-block;
  text-decoration: none;
  text-align: center;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* primary */
.primary {
  background-color: var(--color-ink);
  color: var(--color-paper);
  border: var(--rule-hairline) solid var(--color-ink);
}

.primary:hover:not(:disabled) {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
}

/* outline */
.outline {
  background-color: transparent;
  color: var(--color-ink);
  border: var(--rule-hairline) solid var(--color-ink);
}

.outline:hover:not(:disabled) {
  background-color: var(--color-ink);
  color: var(--color-paper);
}

/* ghost */
.ghost {
  background-color: transparent;
  color: var(--color-ink);
  border: none;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
  padding-left: 0;
  padding-right: 0;
}

.ghost:hover:not(:disabled) {
  color: var(--color-accent);
}
```

- [ ] **Step 2: Write `components/ui/Button.tsx`**

```tsx
import styles from './Button.module.css'

type Variant = 'primary' | 'outline' | 'ghost'

interface ButtonProps {
  variant?: Variant
  href?: string
  download?: boolean | string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  href,
  download,
  onClick,
  type = 'button',
  disabled,
  children,
}: ButtonProps) {
  const className = `${styles.button} ${styles[variant]}`

  if (href) {
    return (
      <a href={href} download={download} className={className}>
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Button.tsx components/ui/Button.module.css
git commit -m "feat: add Button primitive (primary, outline, ghost)"
```

---

### Task 6: Link primitive

**Files:**
- Create: `components/ui/Link.tsx`
- Create: `components/ui/Link.module.css`

- [ ] **Step 1: Write `components/ui/Link.module.css`**

```css
/* Inline body link */
.inline {
  color: var(--color-accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  transition: color var(--duration-fast) var(--ease-out);
}

.inline:hover {
  color: var(--color-accent-hover);
}

/* Nav link */
.nav {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-snug);
  color: var(--color-ink);
  text-decoration: none;
  position: relative;
  padding-bottom: var(--space-1);
}

.nav::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: var(--rule-medium);
  background-color: var(--color-ink);
  transition: width var(--duration-fast) var(--ease-out);
}

.nav:hover::after,
.nav[aria-current='page']::after {
  width: 100%;
}
```

- [ ] **Step 2: Write `components/ui/Link.tsx`**

```tsx
import NextLink from 'next/link'
import styles from './Link.module.css'

interface InlineLinkProps {
  href: string
  children: React.ReactNode
  external?: boolean
}

export function InlineLink({ href, children, external }: InlineLinkProps) {
  if (external) {
    return (
      <a
        href={href}
        className={styles.inline}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }
  return (
    <NextLink href={href} className={styles.inline}>
      {children}
    </NextLink>
  )
}

interface NavLinkProps {
  href: string
  children: React.ReactNode
  currentPath?: string
}

export function NavLink({ href, children, currentPath }: NavLinkProps) {
  const isCurrent = currentPath === href
  return (
    <NextLink
      href={href}
      className={styles.nav}
      aria-current={isCurrent ? 'page' : undefined}
    >
      {children}
    </NextLink>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/Link.tsx components/ui/Link.module.css
git commit -m "feat: add Link primitive (inline, nav)"
```

---

### Task 7: Card primitive

**Files:**
- Create: `components/ui/Card.tsx`
- Create: `components/ui/Card.module.css`

- [ ] **Step 1: Write `components/ui/Card.module.css`**

```css
.card {
  border-top: var(--rule-medium) solid var(--color-ink);
  border-bottom: var(--rule-hairline) solid var(--color-rule);
  padding: var(--space-5) 0;
}

.eyebrow {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-snug);
  color: var(--color-ink-3);
  margin-bottom: var(--space-2);
}

.title {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: 500;
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--color-ink);
  margin-bottom: var(--space-2);
}

.description {
  font-family: var(--font-serif);
  font-size: var(--text-md);
  line-height: var(--leading-loose);
  color: var(--color-ink-2);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.action {
  margin-top: var(--space-4);
}
```

- [ ] **Step 2: Write `components/ui/Card.tsx`**

```tsx
import styles from './Card.module.css'
import { Badge } from './Badge'

interface CardProps {
  eyebrow?: string
  title: string
  description?: string
  badges?: string[]
  action?: React.ReactNode
}

export function Card({ eyebrow, title, description, badges, action }: CardProps) {
  return (
    <div className={styles.card}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {badges && badges.length > 0 && (
        <div className={styles.badges}>
          {badges.slice(0, 3).map((b) => (
            <Badge key={b}>{b}</Badge>
          ))}
        </div>
      )}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/Card.tsx components/ui/Card.module.css
git commit -m "feat: add Card primitive"
```

---

### Task 8: Input primitive

**Files:**
- Create: `components/ui/Input.tsx`
- Create: `components/ui/Input.module.css`

- [ ] **Step 1: Write `components/ui/Input.module.css`**

```css
.wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-snug);
  color: var(--color-ink-2);
}

.field {
  font-family: var(--font-serif);
  font-size: var(--text-md);
  line-height: var(--leading-normal);
  color: var(--color-ink);
  background: transparent;
  border: none;
  border-bottom: var(--rule-hairline) solid var(--color-ink);
  padding: var(--space-2) 0;
  outline: none;
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
}

.field::placeholder {
  color: var(--color-ink-3);
}

.field:focus {
  border-bottom: var(--rule-medium) solid var(--color-accent);
}

.textarea {
  resize: vertical;
  min-height: 120px;
}
```

- [ ] **Step 2: Write `components/ui/Input.tsx`**

```tsx
import styles from './Input.module.css'

interface InputProps {
  label: string
  name: string
  type?: string
  required?: boolean
  as?: 'input' | 'textarea'
  placeholder?: string
  defaultValue?: string
}

export function Input({
  label,
  name,
  type = 'text',
  required,
  as = 'input',
  placeholder,
  defaultValue,
}: InputProps) {
  const id = `field-${name}`
  const fieldClass = `${styles.field} ${as === 'textarea' ? styles.textarea : ''}`

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {as === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={fieldClass}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={fieldClass}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/Input.tsx components/ui/Input.module.css
git commit -m "feat: add Input primitive"
```

---

### Task 9: PageHeader primitive

**Files:**
- Create: `components/ui/PageHeader.tsx`
- Create: `components/ui/PageHeader.module.css`

- [ ] **Step 1: Write `components/ui/PageHeader.module.css`**

```css
.header {
  margin-bottom: var(--space-7);
}

.eyebrow {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-snug);
  color: var(--color-ink-3);
  margin-bottom: var(--space-3);
}

.title {
  font-family: var(--font-serif);
  font-size: var(--text-4xl);
  font-weight: 400;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-ink);
  margin-bottom: var(--space-5);
}

.lead {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: 400;
  line-height: var(--leading-normal);
  color: var(--color-ink-2);
  max-width: 65ch;
  margin-bottom: var(--space-6);
}

.rule {
  border: none;
  border-top: var(--rule-medium) solid var(--color-ink);
  margin: 0;
  width: 100%;
}
```

- [ ] **Step 2: Write `components/ui/PageHeader.tsx`**

```tsx
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  eyebrow: string
  title: string
  lead?: string
}

export function PageHeader({ eyebrow, title, lead }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      {lead && <p className={styles.lead}>{lead}</p>}
      <hr className={styles.rule} />
    </header>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/PageHeader.tsx components/ui/PageHeader.module.css
git commit -m "feat: add PageHeader primitive"
```

---

### Task 10: Table + CodeBlock primitives

**Files:**
- Create: `components/ui/Table.tsx`
- Create: `components/ui/Table.module.css`
- Create: `components/ui/CodeBlock.tsx`
- Create: `components/ui/CodeBlock.module.css`

- [ ] **Step 1: Write `components/ui/Table.module.css`**

```css
.wrapper {
  width: 100%;
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  border-top: var(--rule-medium) solid var(--color-ink);
  border-bottom: var(--rule-medium) solid var(--color-ink);
}

.table thead tr {
  border-bottom: var(--rule-hairline) solid var(--color-ink);
}

.th {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  text-align: left;
  padding: var(--space-3) var(--space-4);
  color: var(--color-ink);
}

.td {
  font-family: var(--font-serif);
  font-size: var(--text-md);
  padding: var(--space-3) var(--space-4);
  color: var(--color-ink);
  line-height: var(--leading-normal);
}
```

- [ ] **Step 2: Write `components/ui/Table.tsx`**

```tsx
import styles from './Table.module.css'

interface TableProps {
  headers: string[]
  rows: (string | React.ReactNode)[][]
}

export function Table({ headers, rows }: TableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={styles.td}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Write `components/ui/CodeBlock.module.css`**

```css
.block {
  background-color: var(--color-paper-2);
  border-left: var(--rule-medium) solid var(--color-rule);
  padding: var(--space-4);
  overflow-x: auto;
}

.code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--color-ink);
  white-space: pre;
}
```

- [ ] **Step 4: Write `components/ui/CodeBlock.tsx`**

```tsx
import styles from './CodeBlock.module.css'

interface CodeBlockProps {
  children: string
}

export function CodeBlock({ children }: CodeBlockProps) {
  return (
    <div className={styles.block}>
      <code className={styles.code}>{children}</code>
    </div>
  )
}
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/Table.tsx components/ui/Table.module.css \
        components/ui/CodeBlock.tsx components/ui/CodeBlock.module.css
git commit -m "feat: add Table and CodeBlock primitives"
```

---

### Task 11: UI barrel export + README

**Files:**
- Create: `components/ui/index.ts`
- Create: `components/ui/README.md`

- [ ] **Step 1: Write `components/ui/index.ts`**

```ts
export { Rule } from './Rule'
export { Badge } from './Badge'
export { Button } from './Button'
export { InlineLink, NavLink } from './Link'
export { Card } from './Card'
export { Input } from './Input'
export { PageHeader } from './PageHeader'
export { Table } from './Table'
export { CodeBlock } from './CodeBlock'
```

- [ ] **Step 2: Write `components/ui/README.md`**

```markdown
# UI Primitives

Eight primitives. No others without updating `STYLE.md` first.

| Name | File | Variants | Use when | Never use for |
|---|---|---|---|---|
| Rule | Rule.tsx | hairline (default), medium | Section dividers | Decorative |
| Badge | Badge.tsx | — | Skill tags (max 3 per card) | Status indicators with color |
| Button | Button.tsx | primary, outline, ghost | CTAs and form submits | Navigation |
| InlineLink | Link.tsx | — | Body text links | Buttons |
| NavLink | Link.tsx | — | Header/footer nav only | Body links |
| Card | Card.tsx | — | Certs, resumes, capabilities | Cards within cards |
| Input | Input.tsx | input (default), textarea | Contact form fields | Search, dropdowns |
| PageHeader | PageHeader.tsx | — | Top of every page | Mid-page headings |
| Table | Table.tsx | — | Tabular data | Layout grids |
| CodeBlock | CodeBlock.tsx | — | Code samples | Long prose |

## Import

```tsx
import { Button, Card, Rule } from '@/components/ui'
```
```

- [ ] **Step 3: Verify barrel export resolves**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/index.ts components/ui/README.md
git commit -m "feat: add UI barrel export and README"
```

---

### Task 12: MobileDrawer component

**Files:**
- Create: `components/MobileDrawer.tsx`
- Create: `components/MobileDrawer.module.css`

- [ ] **Step 1: Write `components/MobileDrawer.module.css`**

```css
.backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(27, 24, 20, 0.4);
  z-index: 40;
  animation: fadeIn var(--duration) var(--ease-out) both;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 80%;
  max-width: 320px;
  background-color: var(--color-paper);
  border-left: var(--rule-hairline) solid var(--color-rule);
  z-index: 50;
  padding: var(--space-6) var(--space-5);
  display: flex;
  flex-direction: column;
  animation: slideIn var(--duration) var(--ease-out) both;
}

.closeRow {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-7);
}

.closeButton {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-ink);
  padding: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
```

- [ ] **Step 2: Write `components/MobileDrawer.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { NavLink } from '@/components/ui'
import styles from './MobileDrawer.module.css'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/rss', label: 'RSS' },
]

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  currentPath: string
}

export function MobileDrawer({ isOpen, onClose, currentPath }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Focus close button on open
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  // ESC to close + focus trap
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key !== 'Tab') return

      const drawer = drawerRef.current
      if (!drawer) return

      const focusable = drawer.querySelectorAll<HTMLElement>(
        'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className={styles.closeRow}>
          <button
            ref={closeButtonRef}
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          </button>
        </div>
        <nav className={styles.nav} aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} currentPath={currentPath}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/MobileDrawer.tsx components/MobileDrawer.module.css
git commit -m "feat: add MobileDrawer with focus trap and ESC close"
```

---

### Task 13: Header component

**Files:**
- Create: `components/Header.tsx`
- Create: `components/Header.module.css`

- [ ] **Step 1: Write `components/Header.module.css`**

```css
.header {
  position: sticky;
  top: 0;
  height: 56px;
  background-color: var(--color-paper);
  border-bottom: var(--rule-hairline) solid var(--color-rule);
  z-index: 30;
  display: flex;
  align-items: center;
}

.inner {
  width: 100%;
  max-width: var(--content-width-wide);
  margin: 0 auto;
  padding: 0 var(--gutter);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wordmark {
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--color-ink);
  text-decoration: none;
}

.desktopNav {
  display: none;
  align-items: center;
  gap: var(--space-6);
}

.hamburger {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-ink);
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: var(--space-2);
}

.hamburger span {
  display: block;
  width: 22px;
  height: 2px;
  background-color: var(--color-ink);
  transition: opacity var(--duration-fast) var(--ease-out);
}

@media (min-width: 720px) {
  .header {
    height: 64px;
  }

  .desktopNav {
    display: flex;
  }

  .hamburger {
    display: none;
  }
}
```

- [ ] **Step 2: Write `components/Header.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavLink } from '@/components/ui'
import { MobileDrawer } from './MobileDrawer'
import styles from './Header.module.css'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/rss', label: 'RSS' },
]

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.wordmark} aria-label="Data With Dillon — home">
            Data With Dillon
          </Link>

          <nav className={styles.desktopNav} aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} currentPath={pathname}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            className={styles.hamburger}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentPath={pathname}
      />
    </>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/Header.tsx components/Header.module.css
git commit -m "feat: add Header with sticky nav and mobile hamburger"
```

---

### Task 14: Footer component

**Files:**
- Create: `components/Footer.tsx`
- Create: `components/Footer.module.css`

- [ ] **Step 1: Write `components/Footer.module.css`**

```css
.footer {
  border-top: var(--rule-hairline) solid var(--color-rule);
  padding: var(--space-7) 0;
  margin-top: var(--space-9);
}

.inner {
  max-width: var(--content-width-wide);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-7);
}

.columnTitle {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--color-ink);
  margin-bottom: var(--space-4);
}

.columnLinks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.columnLink {
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  color: var(--color-ink-2);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out);
}

.columnLink:hover {
  color: var(--color-accent);
}

.meta {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-ink-3);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding-top: var(--space-6);
  border-top: var(--rule-hairline) solid var(--color-rule-soft);
}

@media (min-width: 720px) {
  .columns {
    grid-template-columns: repeat(3, 1fr);
  }

  .inner {
    padding-left: var(--space-7);
    padding-right: var(--space-7);
  }
}
```

- [ ] **Step 2: Write `components/Footer.tsx`**

```tsx
import Link from 'next/link'
import styles from './Footer.module.css'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.columns}>
          <div>
            <p className={styles.columnTitle}>Navigate</p>
            <ul className={styles.columnLinks}>
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
                { href: '/rss', label: 'RSS' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.columnLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={styles.columnTitle}>Elsewhere</p>
            <ul className={styles.columnLinks}>
              <li>
                <a
                  href="https://github.com/dillon-shearer/ds-portfolio"
                  className={styles.columnLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  This site's source
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/dillon-shearer"
                  className={styles.columnLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/dillonshearer/"
                  className={styles.columnLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className={styles.columnTitle}>Connect</p>
            <ul className={styles.columnLinks}>
              <li>
                <a
                  href="mailto:dillon@datawithdillon.com"
                  className={styles.columnLink}
                >
                  dillon@datawithdillon.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.meta}>
          <span>© {year} Dillon Shearer</span>
          <a
            href="https://github.com/dillon-shearer/ds-portfolio"
            className={styles.columnLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            View source
          </a>
          <span>Built with Next.js</span>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/Footer.tsx components/Footer.module.css
git commit -m "feat: add Footer (three-column, Navigate/Elsewhere/Connect)"
```

---

### Task 15: Root layout + globals.css

**Files:**
- Modify: `app/layout.tsx` (replace scaffold version)
- Modify: `app/globals.css` (already done in Task 1 — verify it's correct)

- [ ] **Step 1: Write `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Source_Serif_4, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import '@/styles/tokens.css'
import './globals.css'

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--next-font-serif',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--next-font-sans',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  variable: '--next-font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'Data With Dillon',
    template: '%s | Data With Dillon',
  },
  description:
    'Data engineer and analyst building analytics, pipelines, and AI tooling for healthcare and life-science teams.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Run dev server and open in browser**

```bash
npm run dev
```

Open http://localhost:3000. Expect: cream background, "Data With Dillon" wordmark in header, footer visible, fonts loading correctly.

Stop server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: root layout with next/font, Header, Footer"
```

---

### Task 16: Home page

**Files:**
- Replace: `app/page.tsx`
- Create: `app/page.module.css`

Content sourced from: `/Users/dillon/Desktop/projects/dillon-shearer-website/app/page.tsx`

- [ ] **Step 1: Write `app/page.module.css`**

```css
.hero {
  padding-top: var(--space-9);
  padding-bottom: var(--space-8);
}

.roleLabel {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--color-ink-3);
  margin-bottom: var(--space-4);
}

.name {
  font-family: var(--font-serif);
  font-size: var(--text-4xl);
  font-weight: 400;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-ink);
  margin-bottom: var(--space-5);
}

.valueProp {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: 400;
  line-height: var(--leading-normal);
  color: var(--color-ink-2);
  max-width: 65ch;
  margin-bottom: var(--space-7);
}

.ctas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.section {
  padding: var(--space-8) 0;
}

.sectionEyebrow {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--color-ink-3);
  margin-bottom: var(--space-3);
}

.sectionTitle {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  font-weight: 400;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-ink);
  margin-bottom: var(--space-6);
}

.cards {
  display: flex;
  flex-direction: column;
}

.currently {
  padding: var(--space-7) 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-ink-2);
}
```

- [ ] **Step 2: Write `app/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { Rule, Button, Card } from '@/components/ui'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Data With Dillon',
  description:
    'Data engineer and analyst building analytics, pipelines, and AI tooling for healthcare and life-science teams.',
}

const capabilities = [
  {
    eyebrow: 'Core Focus',
    title: 'Full-Stack Data Engineering',
    description:
      'I design controlled intake flows and deploy production analytics that ingest daily, surface anomalies, and stay accurate long after the go-live meeting.',
    badges: ['Python', 'SQL', 'PostgreSQL'],
  },
  {
    eyebrow: 'Capability',
    title: 'Automation & AI',
    description:
      'Embed automation and assistant workflows that remove repetitive reporting and give operators answers on demand.',
    badges: ['ETL', 'Claude API', 'GitHub Actions'],
  },
  {
    eyebrow: 'Specialization',
    title: 'Healthcare Standards',
    description:
      'Maintain vocabularies, mappings, and documentation so downstream models and dashboards always speak the same language.',
    badges: ['SNOMED', 'LOINC', 'OMOP'],
  },
  {
    eyebrow: 'Toolkit',
    title: 'Technical Stack',
    description:
      'Full-stack capabilities across data engineering, analytics, and web development.',
    badges: ['Tableau', 'Power BI', 'React'],
  },
]

export default function HomePage() {
  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.roleLabel}>Data Engineer · Analyst</p>
        <h1 className={styles.name}>Dillon Shearer</h1>
        <p className={styles.valueProp}>
          Data-centric software engineer working end to end across the data
          lifecycle. Currently building analytics, pipelines, and AI tooling for
          healthcare and life-science teams.
        </p>
        <div className={styles.ctas}>
          <Button href="/contact" variant="primary">Get in touch</Button>
          <Button href="/about" variant="outline">About me</Button>
        </div>
      </section>

      <Rule weight="medium" />

      {/* What I Do */}
      <section className={styles.section}>
        <p className={styles.sectionEyebrow}>What I Do</p>
        <h2 className={styles.sectionTitle}>End-to-end data work</h2>
        <div className={styles.cards}>
          {capabilities.map((cap) => (
            <Card
              key={cap.title}
              eyebrow={cap.eyebrow}
              title={cap.title}
              description={cap.description}
              badges={cap.badges}
            />
          ))}
        </div>
      </section>

      <Rule weight="medium" />

      {/* Currently */}
      <p className={styles.currently}>
        Currently: Data scientist at Answer ALS, building analytics and pipelines for ALS research.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit && npm run build
```

Expected: no errors, successful build.

- [ ] **Step 4: Spot-check visually**

```bash
npm run dev
```

Open http://localhost:3000. Check at 360px and 1440px browser width. Confirm: cream background, no shadows, no gradients, cards have top ink rule, fonts are correct.

Stop server.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/page.module.css
git commit -m "feat: Home page (hero, What I Do, Currently)"
```

---

### Task 17: About page

**Files:**
- Create: `app/about/page.tsx`
- Create: `app/about/page.module.css`

Content sourced from: `/Users/dillon/Desktop/projects/dillon-shearer-website/app/about/page.tsx` and `/Users/dillon/Desktop/projects/dillon-shearer-website/lib/resume-data.ts`

- [ ] **Step 1: Write `app/about/page.module.css`**

```css
.prose {
  font-family: var(--font-serif);
  font-size: var(--text-md);
  line-height: var(--leading-loose);
  color: var(--color-ink);
  max-width: 65ch;
}

.prose p + p {
  margin-top: var(--space-5);
}

.section {
  margin-top: var(--space-8);
}

.sectionTitle {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  font-weight: 400;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-ink);
  margin-bottom: var(--space-3);
}

.sectionIntro {
  font-family: var(--font-serif);
  font-size: var(--text-md);
  line-height: var(--leading-loose);
  color: var(--color-ink-2);
  margin-bottom: var(--space-6);
  max-width: 60ch;
}

.cards {
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 2: Write `app/about/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { PageHeader, Rule, Card, Button } from '@/components/ui'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Data-centric software engineer building data systems, analytics, and applications. Currently focused on healthcare and life sciences.',
}

const resumes = [
  {
    eyebrow: 'Resume · Data Engineer',
    title: 'Data Engineer',
    description: 'Pipelines, infrastructure, and data reliability.',
    file: '/resumes/Dillon_Shearer_Resume.pdf',
  },
  {
    eyebrow: 'Resume · Data Analyst',
    title: 'Data Analyst',
    description: 'Analytics, dashboards, and business intelligence.',
    file: '/resumes/Dillon_Shearer_Resume.pdf',
  },
  {
    eyebrow: 'Resume · Comprehensive',
    title: 'Comprehensive Resume',
    description: 'The complete picture: every skill, project, and experience.',
    file: '/resumes/Dillon_Shearer_Resume.pdf',
  },
]

const certifications = [
  {
    eyebrow: 'Apr 2025 · PHRP Online Training, Inc.',
    title: 'Protecting Human Research Participants',
    description: 'Credential ID: 3004648',
  },
]

export default function AboutPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow="About"
        title="Dillon Shearer"
        lead="Data-centric software engineer building data systems, analytics, and applications. Currently focused on healthcare and life sciences."
      />

      {/* Bio */}
      <div className={styles.prose}>
        <p>
          After graduating with my MIS degree from UWG, I wasn't sure which direction
          to take my career. An internship as a QA/BA at a rare disease data platform
          opened my eyes to the impact that clean, well-structured data can have on real lives.
        </p>
        <p>
          That experience led me to my current role as a data scientist at Answer ALS,
          where I've been building production ETL pipelines, analytics systems, and
          AI tooling for ALS research ever since.
        </p>
        <p>
          What I love most about this work is the variety. Healthcare data challenges
          don't fit into neat categories, so I've embraced everything from building
          AI agents to creating executive dashboards to implementing data transformation tools.
        </p>
        <p>
          Behind every data point is a patient, a family, or a researcher working toward
          better treatments. That's what keeps me focused on getting it right.
        </p>
        <p>
          I believe the best data work happens when you combine technical rigor
          with genuine curiosity about the problems you're solving. I'm always learning
          something new — whether that's mastering a new tool, diving deeper into a domain,
          or finding better ways to communicate complex insights to diverse stakeholders.
        </p>
      </div>

      {/* Resumes */}
      <section className={styles.section}>
        <Rule weight="medium" />
        <div style={{ marginTop: 'var(--space-7)' }}>
          <h2 className={styles.sectionTitle}>Resumes</h2>
          <p className={styles.sectionIntro}>
            Role-specific resumes available for download. Each is tailored to a different
            position type.
          </p>
          <div className={styles.cards}>
            {resumes.map((r) => (
              <Card
                key={r.title}
                eyebrow={r.eyebrow}
                title={r.title}
                description={r.description}
                action={
                  <Button href={r.file} variant="outline" download>
                    Download PDF
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className={styles.section}>
        <Rule weight="medium" />
        <div style={{ marginTop: 'var(--space-7)' }}>
          <h2 className={styles.sectionTitle}>Certifications</h2>
          <p className={styles.sectionIntro}>
            Completed certifications and training programs.
          </p>
          <div className={styles.cards}>
            {certifications.map((c) => (
              <Card
                key={c.title}
                eyebrow={c.eyebrow}
                title={c.title}
                description={c.description}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Copy the existing PDF into the project**

```bash
cp /Users/dillon/Desktop/projects/dillon-shearer-website/public/Dillon_Shearer_Resume.pdf \
   /Users/dillon/Desktop/projects/ds-portfolio/public/resumes/Dillon_Shearer_Resume.pdf
```

Note to owner: the three resume cards above all link to the same PDF. When role-specific PDFs are ready, update the `file` paths in the `resumes` array in `app/about/page.tsx`.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/about/ public/resumes/
git commit -m "feat: About page (bio, resumes, certifications)"
```

---

### Task 18: Contact page + Server Action

**Files:**
- Create: `app/contact/page.tsx`
- Create: `app/contact/page.module.css`
- Create: `app/contact/ContactForm.tsx`
- Create: `app/contact/actions.ts`

Ported directly from `/Users/dillon/Desktop/projects/dillon-shearer-website/app/contact/actions.ts` and `contact-form.tsx`. Contact form has 3 fields (Name, Email, Message — no Subject field).

- [ ] **Step 1: Write `app/contact/actions.ts`**

```ts
'use server'

import { headers } from 'next/headers'

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const submissionBuckets = new Map<string, { count: number; resetAt: number }>()

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false
  const allowed = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://datawithdillon.com',
    'https://www.datawithdillon.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[]
  return allowed.some((base) => origin.startsWith(base))
}

function getClientIp(headerList: Headers): string {
  const forwarded = headerList.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headerList.get('x-real-ip') ?? 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = submissionBuckets.get(ip)
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) return false
    entry.count += 1
    submissionBuckets.set(ip, entry)
    return true
  }
  submissionBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
  return true
}

export type FormResult =
  | { success: true }
  | { error: 'missing' | 'invalid-email' | 'rate-limit' | 'spam' | 'forbidden' | 'send' }

export async function submitContactForm(formData: FormData): Promise<FormResult> {
  const headerList = await headers()
  const origin = headerList.get('origin')
  const referer = headerList.get('referer')

  // Honeypot — bots fill this hidden field
  const honeypot = formData.get('company') as string | null
  if (honeypot && honeypot.trim().length > 0) {
    return { error: 'spam' }
  }

  if (!isAllowedOrigin(origin) && !isAllowedOrigin(referer)) {
    return { error: 'forbidden' }
  }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const message = (formData.get('message') as string | null)?.trim() ?? ''

  if (!name || !email || !message) {
    return { error: 'missing' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'invalid-email' }
  }

  const ip = getClientIp(headerList)
  if (!checkRateLimit(ip)) {
    return { error: 'rate-limit' }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY missing')
    return { error: 'send' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'contact@datawithdillon.com',
        to: 'dillon@datawithdillon.com',
        subject: `New message from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <div style="background:#f5f5f5;padding:15px;margin:10px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <hr>
          <p><small>Sent from datawithdillon.com contact form</small></p>
        `,
        reply_to: email,
      }),
    })

    if (response.ok) return { success: true }

    const errorData = await response.text()
    console.error('Resend API error:', response.status, errorData)
    return { error: 'send' }
  } catch (err) {
    console.error('Email sending failed:', err)
    return { error: 'send' }
  }
}
```

- [ ] **Step 2: Write `app/contact/ContactForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Input, Button } from '@/components/ui'
import { submitContactForm, type FormResult } from './actions'
import styles from './page.module.css'

type Status = 'idle' | 'sending' | FormResult

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const formData = new FormData(e.currentTarget)
    const result = await submitContactForm(formData)
    setStatus(result)
    if ('success' in result && result.success) {
      (e.target as HTMLFormElement).reset()
    }
  }

  const messages: Record<string, string> = {
    'missing': 'Please fill in all required fields.',
    'invalid-email': 'Please enter a valid email address.',
    'rate-limit': 'You've reached the hourly limit. Try again later or email me directly.',
    'spam': 'Something felt off about that submission. Please try again.',
    'forbidden': 'Please submit the form from datawithdillon.com.',
    'send': 'Something went wrong. Please try again or email me directly at dillon@datawithdillon.com.',
  }

  const isSuccess = typeof status === 'object' && 'success' in status
  const errorKey = typeof status === 'object' && 'error' in status ? status.error : null

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {/* Honeypot */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: 'none' }}
        autoComplete="off"
      />

      {isSuccess && (
        <p className={styles.successMsg} role="status">
          Thanks for your message. I'll get back to you soon.
        </p>
      )}

      {errorKey && (
        <p className={styles.errorMsg} role="alert">
          {messages[errorKey]}
        </p>
      )}

      <div className={styles.fields}>
        <Input label="Name" name="name" required />
        <Input label="Email" name="email" type="email" required />
        <Input label="Message" name="message" as="textarea" required />
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={status === 'sending'}
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Write `app/contact/page.module.css`**

```css
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.successMsg {
  font-family: var(--font-serif);
  font-size: var(--text-md);
  color: var(--color-positive);
  padding: var(--space-4) 0;
  border-top: var(--rule-hairline) solid var(--color-positive);
  border-bottom: var(--rule-hairline) solid var(--color-positive);
}

.errorMsg {
  font-family: var(--font-serif);
  font-size: var(--text-md);
  color: var(--color-accent);
  padding: var(--space-4) 0;
  border-top: var(--rule-hairline) solid var(--color-accent);
  border-bottom: var(--rule-hairline) solid var(--color-accent);
}

.altLinks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
  margin-top: var(--space-3);
}

.altLink {
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  color: var(--color-accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  transition: color var(--duration-fast) var(--ease-out);
}

.altLink:hover {
  color: var(--color-accent-hover);
}
```

- [ ] **Step 4: Write `app/contact/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { PageHeader, Rule } from '@/components/ui'
import { ContactForm } from './ContactForm'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Dillon Shearer for data engineering, analytics, or healthcare data projects.',
}

export default function ContactPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        lead="I'd love to hear from you. Send me a message and I'll respond as soon as possible."
      />

      <ContactForm />

      <Rule />

      <div className={styles.altLinks} style={{ marginTop: 'var(--space-6)' }}>
        <a href="mailto:dillon@datawithdillon.com" className={styles.altLink}>
          dillon@datawithdillon.com
        </a>
        <a
          href="https://www.linkedin.com/in/dillonshearer/"
          className={styles.altLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        <a
          href="https://github.com/dillon-shearer"
          className={styles.altLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add `RESEND_API_KEY` to `.env.local`**

```bash
echo "RESEND_API_KEY=your_key_here" >> .env.local
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" >> .env.local
```

Copy the actual key from `/Users/dillon/Desktop/projects/dillon-shearer-website/.env.local`.

- [ ] **Step 6: Verify build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add app/contact/
git commit -m "feat: Contact page + Server Action (ported from existing site)"
```

---

### Task 19: RSS feed route + /rss/about page

**Files:**
- Create: `app/rss/route.ts`
- Create: `app/rss/about/page.tsx`
- Create: `app/rss/about/page.module.css`

- [ ] **Step 1: Write `app/rss/route.ts`**

```ts
import { NextResponse } from 'next/server'

const SITE_URL = 'https://datawithdillon.com'
const SITE_TITLE = 'Data With Dillon'
const SITE_DESCRIPTION =
  'Data engineer and analyst building analytics, pipelines, and AI tooling for healthcare and life-science teams.'

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss" rel="self" type="application/rss+xml" />
    <item>
      <title>Site launched</title>
      <link>${SITE_URL}</link>
      <guid isPermaLink="true">${SITE_URL}</guid>
      <description>datawithdillon.com rebuilt with a print-editorial design system.</description>
      <pubDate>Tue, 27 May 2026 00:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
```

- [ ] **Step 2: Write `app/rss/about/page.module.css`**

```css
.prose {
  font-family: var(--font-serif);
  font-size: var(--text-md);
  line-height: var(--leading-loose);
  color: var(--color-ink);
  max-width: 65ch;
}

.prose p + p {
  margin-top: var(--space-5);
}

.readers {
  margin-top: var(--space-6);
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 3: Write `app/rss/about/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { PageHeader, Card, InlineLink } from '@/components/ui'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'RSS Feed',
  description: 'Subscribe to updates from Data With Dillon via RSS.',
}

const readers = [
  { title: 'Feedly', description: 'Web-based, free tier available.', href: 'https://feedly.com' },
  { title: 'NetNewsWire', description: 'Free, open source, Mac and iOS.', href: 'https://netnewswire.com' },
  { title: 'Reeder', description: 'Mac and iOS, polished reading experience.', href: 'https://reederapp.com' },
]

export default function RssAboutPage() {
  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow="Subscribe"
        title="RSS Feed"
        lead="Follow site updates without social media."
      />

      <div className={styles.prose}>
        <p>
          RSS is an open format that lets you subscribe to websites and read their
          updates in one place — your RSS reader — without visiting each site individually
          and without any algorithm deciding what you see.
        </p>
        <p>
          To subscribe, copy the feed URL below and paste it into your RSS reader:
        </p>
        <p>
          <InlineLink href="https://datawithdillon.com/rss">
            https://datawithdillon.com/rss
          </InlineLink>
        </p>
        <p>
          Don't have an RSS reader yet? Here are a few good ones:
        </p>
      </div>

      <div className={styles.readers}>
        {readers.map((r) => (
          <Card
            key={r.title}
            title={r.title}
            description={r.description}
            action={
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wide)',
                  color: 'var(--color-accent)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Visit site
              </a>
            }
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify RSS XML is valid**

```bash
npm run dev &
curl http://localhost:3000/rss
```

Confirm XML output. Stop server.

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add app/rss/
git commit -m "feat: RSS 2.0 feed route + /rss/about human-readable page"
```

---

### Task 20: 404 not-found page

**Files:**
- Replace: `app/not-found.tsx`
- Create: `app/not-found.module.css`

- [ ] **Step 1: Write `app/not-found.module.css`**

```css
.wrapper {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-9) var(--gutter);
}

.eyebrow {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--color-ink-3);
  margin-bottom: var(--space-3);
}

.heading {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  font-weight: 400;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-ink);
  margin-bottom: var(--space-5);
}

.message {
  font-family: var(--font-serif);
  font-size: var(--text-md);
  line-height: var(--leading-loose);
  color: var(--color-ink-2);
  margin-bottom: var(--space-6);
}
```

- [ ] **Step 2: Write `app/not-found.tsx`**

```tsx
import Link from 'next/link'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <p className={styles.eyebrow}>404</p>
      <h1 className={styles.heading}>Page not found</h1>
      <p className={styles.message}>
        This page doesn't exist. It may have moved or been removed.
      </p>
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide)',
          color: 'var(--color-accent)',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
        }}
      >
        Back to home
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/not-found.tsx app/not-found.module.css
git commit -m "feat: 404 not-found page"
```

---

### Task 21: Copy public assets

**Files:**
- Copy: `favicon.ico`, `ds.jpg` from old site

- [ ] **Step 1: Copy assets**

```bash
cp /Users/dillon/Desktop/projects/dillon-shearer-website/public/favicon.ico \
   /Users/dillon/Desktop/projects/ds-portfolio/public/favicon.ico

cp /Users/dillon/Desktop/projects/dillon-shearer-website/public/ds.jpg \
   /Users/dillon/Desktop/projects/ds-portfolio/public/ds.jpg
```

- [ ] **Step 2: Commit**

```bash
git add public/favicon.ico public/ds.jpg
git commit -m "feat: copy favicon and profile photo from existing site"
```

---

### Task 22: Full build + acceptance checklist

- [ ] **Step 1: Final build**

```bash
npm run build
```

Expected: no errors, no warnings about missing dependencies.

- [ ] **Step 2: Run dev and check each page**

```bash
npm run dev
```

Visit and verify at 360px and 1440px browser width:
- http://localhost:3000 — hero, cards, rule separators
- http://localhost:3000/about — bio, resume cards with download buttons, cert card
- http://localhost:3000/contact — form, alt links below rule
- http://localhost:3000/rss — raw XML in browser
- http://localhost:3000/rss/about — readable page
- http://localhost:3000/nonexistent-path — 404 with link to home

- [ ] **Step 3: Design integrity checklist**

```bash
# Check for hardcoded hex values in component files (should be zero results)
grep -rn "#[0-9a-fA-F]\{3,6\}" components/ app/ --include="*.tsx" --include="*.ts" --include="*.css" | grep -v "tokens.css" | grep -v "node_modules"

# Check for hardcoded font-family (should be zero results)
grep -rn "font-family:" components/ app/ --include="*.css" | grep -v "tokens.css" | grep -v "var(--font"

# Check for border-radius > 2px (should be zero results)
grep -rn "border-radius" components/ app/ --include="*.css" | grep -v "var(--radius"

# Check for box-shadow (should be zero results)
grep -rn "box-shadow" components/ app/ --include="*.css"

# Check for gradient backgrounds (should be zero results)
grep -rn "linear-gradient\|radial-gradient" components/ app/ --include="*.css"
```

All five should return zero matches.

- [ ] **Step 4: Nav item count check**

```bash
grep -n "href" components/Header.tsx | grep -v "//\|aria" | wc -l
```

Expected: 4 (Home, About, Contact, RSS) plus the wordmark link = 5 total `href` attributes.

- [ ] **Step 5: Commit final state**

```bash
git add -A
git commit -m "chore: acceptance checklist pass — all design constraints verified"
```

---

## Environment variables required before deployment

Copy from `/Users/dillon/Desktop/projects/dillon-shearer-website/.env.local`:

```
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=https://datawithdillon.com
```

Set both in Vercel project settings before going live.
