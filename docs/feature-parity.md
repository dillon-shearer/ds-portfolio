# Feature Parity Checklist

Snapshot date: 2026-08-04. Source of truth for the site modernization.
Every item below exists on the live site today and MUST survive the rebuild
unless marked [DECIDED: remove] or listed under "Known defects" with a
disposition. After any rebuild ticket, verify the items it touches.

Rules for this document: ASCII only. No em dashes, smart quotes, or emoji.

---

## 1. Routes

| Path | Type | Notes |
|---|---|---|
| / | page | Home |
| /about | page | Bio, resumes, certifications |
| /contact | page | Contact form (Resend) + social links |
| /dashboards | page | Dashboard list |
| /dashboards/coming-soon | page | Orphan (nothing links to it) - keep reachable |
| /dashboards/gym | page | Gym tracker, force-dynamic |
| /rss | page | Human-readable RSS explainer, unlinked from nav |
| /rss/feed | route | RSS 2.0 XML, cache s-maxage=3600 |
| /api/gym-data | route | JSON export, auth-free by design |
| /api/gym-data.csv | route | CSV export, auth-free by design |
| /api/gym-chat | route | OpenAI chat, SSE streaming optional |
| not-found | page | Custom 404 |

[DECIDED: remove] /gg-chatbot - removed 2026-08-04 by owner instruction.
public/gg-chatbot.html deleted, rewrite and noindex headers removed from
next.config.ts. Do not restore.

## 2. Global shell

- [ ] Fonts via next/font/google mapped to CSS vars consumed in tokens.css
- [ ] Root metadata: title "Data With Dillon" + template "%s | Data With Dillon", description
- [ ] SiteChrome: NAKED_PATHS (currently empty) renders no Header/Footer/main for listed pathnames
- [ ] Header: sticky, wordmark link to / (aria-label "Data With Dillon, home"),
      desktop nav (Home, About, Dashboards, Contact), hamburger at <720px
- [ ] MobileDrawer: role=dialog aria-modal, focus trap (Tab/Shift+Tab), ESC close,
      backdrop click close, focus close button on open, body scroll lock
- [ ] Footer: Navigate (Home, About, Contact), Elsewhere (site source repo,
      GitHub, LinkedIn), Connect (mailto dillon@datawithdillon.com),
      meta row: (c) year, "View source", "Built with Next.js"
- [ ] 404 page: eyebrow "404", "Page not found", back-to-home link
- [ ] NavLink sets aria-current=page on active route (see defect 7.3: exact-match only today)

## 3. Home (/)

- [ ] Hero: role label "Data Analyst . Engineer" (currently uses an interpunct),
      h1 "Dillon Shearer", value-prop paragraph ("I do data work for healthcare
      and life science teams..."), CTAs: "Get in touch" -> /contact (primary),
      "About me" -> /about (outline)
- [ ] "The work" section: 4 capability cards, each eyebrow + title + description
      + 3 badges: Data pipelines / Documentation and standards / Analytics and
      reporting / Whatever the project needs

## 4. About (/about)

- [ ] PageHeader: eyebrow "About", title "Dillon Shearer", lead
- [ ] Bio: 5 paragraphs (UWG MIS degree + rare-disease internship; data
      scientist at Answer ALS; breadth of healthcare data work; "behind every
      data point is a patient"; learning philosophy)
- [ ] Resumes: 2 cards (Data Engineer, Data Analyst) with Download PDF buttons.
      Both currently point at /resumes/Dillon_Shearer_Resume.pdf (defect 7.2)
- [ ] Certifications: 1 entry - Protecting Human Research Participants,
      Apr 2025, PHRP Online Training, Inc., Credential ID 3004648

## 5. Contact (/contact)

- [ ] PageHeader: eyebrow "Contact", title "Get in touch", lead
- [ ] Form fields: Name (required), Email (required, type=email),
      Message (textarea, required); form has noValidate (server validates)
- [ ] Hidden honeypot input name="company" (display:none, tabIndex -1, aria-hidden)
- [ ] Status flow: "Sending..." disabled state; success role=status message
      "Thanks for your message. I'll get back to you soon." + form reset;
      errors role=alert with per-code messages (spam/forbidden/missing/
      invalid-email/rate-limit/send)
- [ ] Server action order: honeypot -> origin/referer allowlist
      (NEXT_PUBLIC_SITE_URL, datawithdillon.com, www, localhost:3000/3001) ->
      required-fields -> email regex -> rate limit 5/hr/IP -> Resend send
      (from contact@, to dillon@, reply_to submitter)
- [ ] Elsewhere grid: Email / LinkedIn (linkedin.com/in/dillonshearer) /
      GitHub (github.com/dillon-shearer) with inline SVG icons, centered,
      no border lines (recent intentional change)

## 6. Dashboards

### /dashboards
- [ ] PageHeader (no rule), lead copy
- [ ] 1 entry: Gym Tracker, tool label "Next.js + PostgreSQL", expandable
      DashboardCard (data-expanded CSS animation), long description, tech tags
      (Next.js, PostgreSQL, Recharts, React Three Fiber, OpenAI),
      link to /dashboards/gym

### /dashboards/gym - shell
- [ ] Tabs: Dashboard / Log Workout (role=tab, aria-selected)
- [ ] TimeRangeSelector: Day / 7d / 30d / YTD (aria-pressed group)
- [ ] Day and Year modes: prev/next arrows clamped to dataset min date and
      today (day) or 1970 and current year (year); long-date or year label
- [ ] Back button after drilldown restores previous mode, smooth-scrolls up
- [ ] Download button -> modal: Range (Current filter / All time) x Format
      (CSV / JSON); builds /api/gym-data(.csv) URL with from/to and
      exclude=day_of_week,iso_week,month,year
- [ ] Panel system: no borders, background --color-rule-soft, --space-4 gaps
      (see .claude/STYLE.md; note STYLE.md hex values are stale, tokens.css wins)

### /dashboards/gym - Dashboard tab (7d/30d/YTD/year)
- [ ] KPI row: Total Volume (lbs), Gym Days (X / N), Exercise Variety
- [ ] Daily Volume: Recharts AreaChart, dark tooltip (ink bg, paper text)
- [ ] Split Frequency: Push/Pull/Legs tiles, majority day-tag per date,
      tag normalization strips zero-width chars and nbsp
- [ ] Body Part Frequency: chips with 3px colored left border, sorted by sets,
      --chart-bp-* colors, empty state "No sets in this range"
- [ ] Muscles Trained: R3F 3D body diagram, SSR-safe dynamic import,
      clear color #F2EDE5 == --color-rule-soft (must match panel bg),
      OrbitControls autoRotate (no useFrame spin), zoom/pan disabled,
      heat scale None/Some/Moderate/Trained with legend, mouse tooltip
      "N sets . N lbs", WebGL feature-detect -> SVG fallback
- [ ] Exercise PRs table: sortable columns (Exercise/Weight/Est 1RM/Best Set/
      Date), asc/desc arrows, 5 per page Pager, Best Set + Date hidden on
      mobile, Epley 1RM = weight * (1 + reps/30)
- [ ] Volume Heatmap: hand-rolled SVG, ResizeObserver sizing, quartile
      buckets, 5-step legend, tooltip date + lbs or "Rest day", year wraps rows
- [ ] Recent Sessions: 3 per page cards (long date, title-cased tag,
      "N ex . N sets . N lbs"), click drills into Day view

### /dashboards/gym - Day view
- [ ] Last 7 Days strip: 7 buttons, "Today" label, active/hasData/empty
      states, aria-pressed
- [ ] KPI row: Total Volume, Exercises/Sets/Reps, Top Body Part, Near-Max Sets
      (>= 90% lifetime 1RM)
- [DECIDED: flat treatment] Cumulative Volume by Body Part: area chart with a
      single flat stroke/fill, per-part dots, tooltip, and inline legend. The
      requested gradient is omitted because the locked Studio Ledger contract
      bans gradients; body-part color remains in the dots and legend.
- [ ] Muscle Volume donut: inner 55 / outer 80, tooltip name/lbs/pct/sets,
      empty "No mapped exercises"
- [ ] Sets table: grouped by exercise chronologically, Set/Weight/Reps/
      Est 1RM/% PR, >=90% highlighted, 1RM and %PR hidden on mobile
- [ ] DailyView panel pattern intact: root gap space-4, KPI items
      rule-soft bg + space-5 padding, no border separators

### /dashboards/gym - Log Workout tab
- [ ] PasswordGate: server action compares to LIFT_PASSWORD,
      sessionStorage['gym-gate'], error "Incorrect password."
- [ ] WorkoutForm bootstrap: single getBootstrapData(date) round trip
- [ ] First-run per date: auto-open Day Info -> chain to Body Parts ->
      localStorage flag gymFlowSeenForDate:<date>
- [ ] Add Set: Exercise select filtered by chosen body parts (+ count label,
      Manage Exercises button), Equipment select (Smith Machine, Cable Stack,
      Machine, Dumbbells, Curl Bar, Barbell), Unilateral checkbox (flag only,
      volume = weight x reps one side, never doubled), Weight (0-1500 step
      2.5), Reps (min 1); set number = max + 1; success banner clears reps
      only (fast add), auto-dismiss 2s
- [ ] Workout History: exercise groups by recency, per-exercise volume,
      equipment + UNI badges, Edit modal + Delete with confirm()
- [ ] DayInfoSheet: bottom sheet dialog, date input, Push/Pull/Leg Day chips
- [ ] BodyPartsSheet: 12 body-part tiles, Select All / Clear, Save
- [ ] ExerciseManagerModal: add (name + body part), Filtered/All tabs,
      rename, reassign body part, soft delete with confirm(), catalog
      refetch, renames propagate to selected exercise
- [ ] EditSetModal: date, exercise, equipment, unilateral, weight, reps,
      set number, day tag

### Floating AI chat (both gym tabs)
- [ ] Trigger button bottom-right, square, icon swaps chat/x
- [ ] Panel: height min(560px, 100dvh - 100px) (explicit height, not max);
      resizable via top/left/corner drag handles, min 320x360, size persisted
      to localStorage['gym-chat-panel-size']
- [ ] Start screen: "Gym Chat" + 4 suggested questions
- [ ] Header Clear button resets messages and conversation state
- [ ] Input: auto-grow textarea max 4 lines, Enter sends, Shift+Enter newline,
      hint text, Send disabled when empty/loading
- [ ] Scroll: to-top/to-bottom buttons, auto-scroll on new message
- [ ] Typing indicator dots; per-message Copy with 1.5s "Copied"
- [ ] Streaming: POST accept text/event-stream + x-stream:1, status/error/
      final events, 60s abort, retry box re-sends with same x-request-id
- [ ] Markdown rendering with custom component map; trailing-margin fix
      .message > :last-child.mdP { margin-bottom: 0 }; links target _blank;
      citation [id] anchors
- [ ] Inline charts from chart specs (Bar/Line), dark tooltips
- [ ] Query details disclosure per message: id, purpose, rows/duration,
      params, policy notes, Show SQL, preview table
- [ ] NO follow-up ideas row (intentionally removed - do not restore)

## 7. RSS

- [ ] /rss page: PageHeader (eyebrow "Subscribe"), explainer prose, feed URL
      link, 3 reader cards (Feedly, NetNewsWire, Reeder)
- [ ] /rss/feed: RSS 2.0 XML, single "Site launched" item (27 May 2026),
      application/xml, s-maxage 3600

## 8. API contracts

- [ ] GET /api/gym-data: params day/from/to/page/limit(1-500, default 200)/
      exclude; enriched fields volume, oneRM_est, day_of_week, iso_week,
      month, year; meta block + data; content-disposition attachment;
      rate limit 20/15min/IP -> 429 with x-ratelimit-* headers; NO auth
      (download modal depends on this - never add auth)
- [ ] GET /api/gym-data.csv: params day/from/to/exclude; same enrichment;
      csv escaping; attachment; no-store
- [ ] POST /api/gym-chat: nodejs runtime, force-dynamic, maxDuration 60;
      optional SSE; tool loop with execute_gym_query; every SQL passes
      validateAndRewriteSql; connection forced read-only + statement_timeout;
      readonly URL from GYM_CHAT_DATABASE_URL_READONLY (dev-only fallbacks);
      conversation trim head 2 + tail 46 with bridge summary; body_parts and
      exercise catalog injected into system prompt at request start

## 9. Stack, tooling, environment

- Next.js 15.5.18 (exact pin) + React 19.1.0, TypeScript strict, Turbopack
  dev and build, npm (package-lock v3)
- CSS Modules + styles/tokens.css; no Tailwind, no UI library
- Fonts: Source Serif 4, IBM Plex Sans (400/500), IBM Plex Mono (400)
- Deps: @vercel/postgres, recharts 3, @react-three/fiber 9 + drei 10 +
  three 0.184, react-markdown 10, pgsql-ast-parser 12, zod 4, nosleep.js
- No ESLint, no Prettier, no tests, no CI, no analytics
- Deploy: push to main -> Vercel auto-deploy; domain datawithdillon.com
- Env vars: RESEND_API_KEY, NEXT_PUBLIC_SITE_URL, DATABASE_URL,
  DATABASE_URL_UNPOOLED, GYM_CHAT_DATABASE_URL_READONLY, OPENAI_API_KEY
  (alias GYM_CHAT_OPENAI_API_KEY), OPENAI_API_BASE_URL, GYM_CHAT_MODEL /
  OPENAI_MODEL, LIFT_PASSWORD; dev fallbacks POSTGRES_URL_NON_POOLING,
  POSTGRES_URL; GYM_CHAT_SCHEMA_URL (optional)
- DB: Neon Postgres; tables gym_lifts, gym_day_meta, exercises,
  exercise_aliases, body_parts; view gym_lifts_v (muscle-aware); one
  migration file db/migrations/2026-05-31-gym-data-unification.sql;
  no migration framework (one-shot SQL + throwaway runner)
- public/: resumes/Dillon_Shearer_Resume.pdf, ds.jpg (unreferenced),
  favicon.ico only (no OG image, no manifest, no metadataBase)

## 10. Known defects and dead code (dispositions set during redesign)

Pre-existing issues. Each redesign ticket states which of these it fixes;
none of these are parity requirements.

1.  Content is 100% hardcoded in TSX; no data files. NAV_ITEMS duplicated in
    Header.tsx and MobileDrawer.tsx; a third divergent nav in Footer.tsx.
2.  Both resume cards link to the same PDF while copy promises role-specific
    resumes.
3.  NavLink active state is exact-match only; /dashboards/gym never
    highlights Dashboards.
4.  EXERCISES_BY_BODY_PART map duplicated 4x (GymDashboard, DailyView index,
    MuscleVolumeDonut, CumulativeVolumeChart) and redundant with the
    exercises DB table; exercises added via Manage Exercises fall through to
    'other' in charts. normalize() differs between copies (/s\b/g vs /s\b/),
    alias sets differ (donut missing Hip Thrusts / Pull Up / Pull Over), so
    charts can disagree on the same day. Typos in all copies: "Pendelum
    Squat", "Hamstrick Kickback", "Rear Delt Xs" (verify against DB values
    before "fixing").
5.  Hardcoded hex color maps in MuscleVolumeDonut, CumulativeVolumeChart,
    BodyDiagram (triceps #5A7A8A vs #8A7F71 inconsistency), VolumeHeatmap
    palette; violates the tokens.css contract.
6.  Est-1RM formula duplicated 5x; volume formula 10x; enrich() + OutRow
    byte-identical in both gym-data routes; formatLongDate duplicated;
    DAYTAG_DEFAULTS duplicated client+server; site description duplicated
    (layout.tsx + rss feed route).
7.  BodyPart union type declared 3x; panels import it from the R3F component,
    dragging three.js into the type graph of every chart.
8.  Dead code: components/ui/CodeBlock, components/ui/Table, components/ui/
    Rule (unused import in app/page.tsx), lib/gym-chat/conversation.ts,
    getRecentLifts, five unused 'use server' exports in gym/catalog.ts
    (publicly reachable endpoints with no UI), extractToken in
    /api/gym-data (auth never wired),
    localStorage gymLastUsedBodyParts written-never-read, public/file.svg,
    globe.svg, window.svg, public/ds.jpg, StatWidget accent prop,
    VolumeHeatmap dead cursor ternary.
9.  Button link branch renders raw <a>, so internal hrefs (home hero CTAs)
    full-page reload instead of client navigation.
10. In-memory rate limiters (contact 5/hr, gym-data 20/15min) reset per
    serverless instance; limits not actually enforced. gym-data.csv has no
    rate limit at all.
11. Contact email interpolates name/email/message into HTML with only
    newline -> <br>; no escaping (HTML injection into own inbox).
12. /rss and /rss/feed are undiscoverable: no nav/footer link, no
    <link rel="alternate"> in layout. Feed has one hardcoded item and will
    never change.
13. Inline style objects instead of CSS modules: not-found.tsx, rss reader
    card links, Badge.tsx, Rule.tsx.
14. Metadata gaps: no metadataBase, no OG/Twitter cards, no sitemap, no
    robots.ts, no manifest, favicon.ico only.
15. Docs drift: docs/superpowers/ referenced by CLAUDE.md/README does not
    exist; .claude/STYLE.md quotes stale hex for paper/rule-soft (tokens.css
    is truth); ui/README.md says "eight primitives" but lists ten and
    index.ts exports eleven.
16. @vercel/postgres is effectively unmaintained; two documented footguns;
    four overlapping Postgres env vars. Candidate: @neondatabase/serverless.
17. No .env.example; required env set discoverable only by grep.
18. Zero non-ASCII enforcement: site bans em/en dashes by convention only;
    interpuncts currently used in eyebrows (allowed today, decide in
    redesign).
19. lib/gym-chat is ~5,750 lines serving one widget; keep-vs-trim decision
    deferred (out of redesign scope unless a ticket says otherwise).
20. FloatingChatWidget renders outside the tab conditional, so the chat
    bubble floats over the password gate on Log Workout (confirm intended).
