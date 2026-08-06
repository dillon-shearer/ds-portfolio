import { SOCIALS } from './site'

export type CaseStudyStat = {
  value: string
  label: string
  detail: string
}

export type CaseStudySource = {
  label: string
  detail: string
  href: string
}

export type CaseStudySection = {
  eyebrow: string
  title: string
  paragraphs: string[]
  sourceLabels: string[]
}

export type GymTrackerCaseStudy = {
  route: string
  metadataTitle: string
  metadataDescription: string
  eyebrow: string
  title: string
  lead: string
  stats: CaseStudyStat[]
  sections: CaseStudySection[]
  sourceHeading: string
  sourceIntro: string
  sources: CaseStudySource[]
  dashboardLinkLabel: string
  dashboardLinkHref: string
  statsAriaLabel: string
  relatedAriaLabel: string
  backToDashboardsLabel: string
  rssTitle: string
  rssDescription: string
  rssPubDate: string
  sourceAriaLabel: string
}

export const GYM_TRACKER_CASE_STUDY = {
  route: '/work/gym-tracker',
  metadataTitle: 'Gym Tracker AI chat case study',
  metadataDescription:
    'How the Gym Tracker combines a read-only SQL policy, live schema context, muscle-aware data, and Recharts plus React Three Fiber visualizations.',
  eyebrow: 'CASE STUDY / GYM TRACKER',
  title: 'A chat boundary around a training database',
  lead: 'The Gym Tracker is a workout log, analytics dashboard, and AI coach. The interesting part is the boundary between the coach and the database: every query is inspected, constrained, enriched, and returned with enough context for the model to recover when the first attempt is wrong.',
  stats: [
    { value: '958', label: 'LINES', detail: 'AST validation in sql-policy.ts' },
    { value: 'SELECT', label: 'POLICY', detail: 'Read-only queries reach Postgres' },
    { value: 'LIVE', label: 'CATALOG', detail: 'Schema and body-part values join the prompt' },
    { value: 'R3F', label: 'VISUALS', detail: '3D body map beside Recharts panels' },
  ],
  sections: [
    {
      eyebrow: '01 / SQL POLICY',
      title: 'The model gets a boundary, not a database connection.',
      paragraphs: [
        'I do not let the model send arbitrary SQL to PostgreSQL. Its query passes through validateAndRewriteSql, which parses the statement with pgsql-ast-parser, rejects forbidden syntax, checks tables and columns against the allowlist, parameterizes string literals, validates CTE scope, and applies a limit and time window.',
        'Only a single SELECT or WITH ... SELECT is accepted. The policy returns rewritten SQL and parameters for the executor. The boundary is explicit in code, so a prompt cannot turn a coaching question into a write operation.',
      ],
      sourceLabels: ['SQL policy AST validator'],
    },
    {
      eyebrow: '02 / PROMPT CONTEXT',
      title: 'The prompt knows the current shape of the data.',
      paragraphs: [
        'The chat route builds its system prompt from the catalog, metric definitions, semantic query hints, and the current body-part values. The catalog reads the allowed tables and columns from information_schema, caches the result, and keeps a fallback schema for local or unavailable database connections.',
        'Body parts are loaded separately from body_parts. The model receives the exact keys it can use in filters and gym_lifts_v comparisons. That removes a common source of failure: inventing a label that is close to the display name but not valid in the data.',
      ],
      sourceLabels: ['Prompt construction and tool results', 'Live schema and body-part catalog'],
    },
    {
      eyebrow: '03 / DATA MODEL',
      title: 'The view resolves anatomy before the chat has to reason about it.',
      paragraphs: [
        'gym_lifts stores the exercise text that was logged. The gym_lifts_v view joins that text to exercises and exercise_aliases, then exposes canonical_name and body_part_key. An entry such as RDL can resolve to the canonical exercise without making every model query repeat alias logic.',
        'The chat keeps planned intent separate from logged work. gym_day_meta.body_parts describes the muscles planned for a training day. gym_lifts_v.body_part_key describes the muscles attached to sets that were actually logged. Comparing the arrays makes gaps visible instead of treating a plan as proof of completed work.',
      ],
      sourceLabels: ['Muscle-aware view migration', 'Prompt construction and tool results'],
    },
    {
      eyebrow: '04 / FAILURE PATH',
      title: 'A failed query becomes useful context for the next turn.',
      paragraphs: [
        'The executor returns the query id, purpose, rewritten SQL, parameters, row count, preview rows, applied policy, and error. Validation failures are captured in the same shape as database failures. The model can see what failed, explain what is missing, and choose a narrower follow-up instead of receiving a generic server error.',
        'The response also limits preview rows while preserving the total row count. That keeps the conversation small without hiding whether a result is a sample or the full result set.',
      ],
      sourceLabels: ['Prompt construction and tool results', 'SQL policy AST validator'],
    },
    {
      eyebrow: '05 / VISUAL LAYER',
      title: 'The dashboard turns the same model into a review surface.',
      paragraphs: [
        'The dashboard uses Recharts for time-series volume and body-part comparisons. React Three Fiber renders the interactive body diagram, so the data can be read as a trend, a table, or a map of trained areas. Each view answers a different question without asking the chat layer to carry the whole interface.',
        'The result is a small system with a clear division of work: PostgreSQL stores the log, the policy controls access, the prompt supplies the vocabulary, the model interprets returned rows, and the dashboard makes the pattern visible.',
      ],
      sourceLabels: [
        'Gym dashboard chart composition',
        'Recharts volume chart',
        'Three.js body diagram',
      ],
    },
  ],
  sourceHeading: 'Read the implementation',
  sourceIntro:
    'The repository is public. These links point to the files behind the decisions described above.',
  sources: [
    {
      label: 'SQL policy AST validator',
      detail: 'Parsing, allowlist checks, parameterization, limits, and CTE scope.',
      href: `${SOCIALS.sourceRepo}/blob/main/lib/gym-chat/sql-policy.ts#L909-L958`,
    },
    {
      label: 'Prompt construction and tool results',
      detail: 'Live context injection, SQL rules, and enriched query errors.',
      href: `${SOCIALS.sourceRepo}/blob/main/app/api/gym-chat/route.ts#L148-L201`,
    },
    {
      label: 'Live schema and body-part catalog',
      detail: 'Allowed tables, database introspection, caching, and exact body-part keys.',
      href: `${SOCIALS.sourceRepo}/blob/main/lib/gym-chat/catalog.ts#L22-L30`,
    },
    {
      label: 'Muscle-aware view migration',
      detail: 'Canonical exercise and alias resolution before the chat query runs.',
      href: `${SOCIALS.sourceRepo}/blob/main/db/migrations/2026-05-31-gym-data-unification.sql#L8-L28`,
    },
    {
      label: 'Gym dashboard chart composition',
      detail: 'Recharts panels and the React Three Fiber body diagram in the dashboard.',
      href: `${SOCIALS.sourceRepo}/blob/main/app/dashboards/gym/GymDashboard.tsx#L8-L19`,
    },
    {
      label: 'Recharts volume chart',
      detail: 'The area chart that turns daily volume into a readable trend.',
      href: `${SOCIALS.sourceRepo}/blob/main/app/dashboards/gym/panels/VolumeChart.tsx#L1-L5`,
    },
    {
      label: 'Three.js body diagram',
      detail: 'The 3D surface that maps training volume onto body parts.',
      href: `${SOCIALS.sourceRepo}/blob/main/app/dashboards/gym/panels/BodyDiagram.tsx#L1-L8`,
    },
  ],
  dashboardLinkLabel: 'Read the engineering case study',
  dashboardLinkHref: '/work/gym-tracker',
  statsAriaLabel: 'Case study facts',
  relatedAriaLabel: 'Related pages',
  backToDashboardsLabel: 'Back to dashboards',
  rssTitle: 'Gym Tracker case study published',
  rssDescription:
    'A case study of the Gym Tracker AI chat boundary, including the read-only SQL policy, live catalog context, muscle-aware view, and dashboard visual layer.',
  rssPubDate: 'Thu, 06 Aug 2026 00:00:00 +0000',
  sourceAriaLabel: 'Open source file',
} as const satisfies GymTrackerCaseStudy
