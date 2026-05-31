# Gym Chat Data Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the gym chat agent first-class access to `exercises`, `exercise_aliases`, `body_parts`, `daytag_defaults`, and a new `gym_lifts_v` view so muscle-classification queries answer from authoritative tables instead of prompt-injected guesswork.

**Architecture:** Add a read-only `gym_lifts_v` view that joins `gym_lifts` to `exercises` via direct name match or `exercise_aliases`, exposing `canonical_name` and `body_part_key`. Grant `gym_chat_ro` SELECT on the 4 reference tables and the view. Replace the catalog's `^gym_` prefix filter with an explicit allowlist. Delete the session-co-occurrence anatomy hack and the corresponding prose in `semantics.ts`; rewrite muscle-aware SQL patterns to use `gym_lifts_v.body_part_key`.

**Tech Stack:** Next.js 15 App Router (Node runtime), `@vercel/postgres`, Neon Postgres, OpenAI Chat Completions via `lib/gym-chat/llm.ts`. No test framework — `npm run build` is the type-check; `curl /api/gym-chat` is the behavior check.

**Reference spec:** `docs/superpowers/specs/2026-05-31-gym-data-unification-design.md`

**Working directory:** `/Users/dillon/Desktop/projects/ds-portfolio`

**Connection environment variables (already in `.env.local`):**
- `DATABASE_URL_UNPOOLED` — owner role, used to run the migration script
- `GYM_CHAT_DATABASE_URL_READONLY` — `gym_chat_ro` role, used by the chat endpoint
- `OPENAI_API_KEY` — required for end-to-end chat verification

**Conventions used throughout this plan:**
- Dev server runs on port 3000 if free, else 3002 (`npm run dev`). Each Task that uses `curl` includes a step to detect the actual port.
- Commits use conventional-commit prefixes (`feat:`, `fix:`, `docs:`, `refactor:`) and end with the project's `Co-Authored-By` trailer.

---

## File Structure

| File | Role | Action |
|---|---|---|
| `db/migrations/2026-05-31-gym-data-unification.sql` | One-shot SQL: view + grants | **Create** |
| `lib/gym-chat/catalog.ts` | Catalog discovery + system-prompt context | Modify (allowlist swap, annotations, delete hack, re-source body_parts) |
| `lib/gym-chat/semantics.ts` | SQL pattern hints injected into the system prompt | Modify (rewrite muscle patterns, add new ones) |
| `lib/gym-chat/capabilities.ts` | Metric / data-scope dictionary | Modify (extend with new tables) |
| `app/api/gym-chat/route.ts` | Chat endpoint + system prompt assembly | Modify (drop imports, update prompt body) |
| `CLAUDE.md` | Project-level agent guidance | Modify (replace obsolete gym-chat gotchas) |

**Not touched:** `lib/gym-chat/sql-policy.ts` (allowlist auto-propagates from catalog), `app/dashboards/gym/actions.ts`, `app/dashboards/gym/catalog.ts`, `app/dashboards/gym/form/WorkoutForm.tsx`, `app/dashboards/gym/form/ExerciseManagerModal.tsx`.

---

## Task 1: Database migration — create view and grants

**Files:**
- Create: `db/migrations/2026-05-31-gym-data-unification.sql`

- [ ] **Step 1: Create the migration directory and SQL script**

```bash
mkdir -p db/migrations
```

Write `db/migrations/2026-05-31-gym-data-unification.sql`:

```sql
-- Gym chat data unification (2026-05-31)
-- Spec: docs/superpowers/specs/2026-05-31-gym-data-unification-design.md
--
-- Safe to re-run. Creates a read-only view that pre-resolves gym_lifts.exercise
-- to canonical_name and body_part_key via exercises + exercise_aliases, and
-- grants SELECT on the reference tables to the chat agent's role.

CREATE OR REPLACE VIEW gym_lifts_v AS
SELECT
  gl.*,
  COALESCE(e_direct.id, e_alias.id)                       AS exercise_id,
  COALESCE(e_direct.name, e_alias.name)                   AS canonical_name,
  COALESCE(e_direct.body_part_key, e_alias.body_part_key) AS body_part_key
FROM gym_lifts gl
LEFT JOIN exercises e_direct
  ON LOWER(TRIM(e_direct.name)) = LOWER(TRIM(gl.exercise))
LEFT JOIN exercise_aliases ea
  ON LOWER(TRIM(ea.alias)) = LOWER(TRIM(gl.exercise))
LEFT JOIN exercises e_alias
  ON e_alias.id = ea.exercise_id;

GRANT SELECT ON
  exercises,
  exercise_aliases,
  body_parts,
  daytag_defaults,
  gym_lifts_v
TO gym_chat_ro;
```

- [ ] **Step 2: Run the migration against Neon using the owner connection**

Use a one-shot Node script (the project uses `@vercel/postgres` so we lean on it for connection handling). Run from the project root so node module resolution works:

```bash
cat > ./run-migration.mjs <<'EOF'
import fs from 'node:fs'
import { createClient, createPool } from '@vercel/postgres'

const env = fs.readFileSync('.env.local', 'utf8')
env.split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i)
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
})

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) { console.error('No owner DB URL in env'); process.exit(1) }

const sql = fs.readFileSync('db/migrations/2026-05-31-gym-data-unification.sql', 'utf8')
const usePool = url.includes('-pooler.')
let client, pool
if (usePool) { pool = createPool({ connectionString: url }); client = await pool.connect() }
else { client = createClient({ connectionString: url }); await client.connect() }

try {
  await client.query(sql)
  console.log('Migration applied successfully.')
} finally {
  if (usePool) { client.release(); await pool.end() } else { await client.end() }
}
EOF
node ./run-migration.mjs
rm ./run-migration.mjs
```

Expected output: `Migration applied successfully.`

- [ ] **Step 3: Verify the view and grants**

```bash
cat > ./verify-migration.mjs <<'EOF'
import fs from 'node:fs'
import { createClient, createPool } from '@vercel/postgres'

const env = fs.readFileSync('.env.local', 'utf8')
env.split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i)
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
})

// Use the readonly role to confirm grants actually work.
const url = process.env.GYM_CHAT_DATABASE_URL_READONLY
const usePool = url.includes('-pooler.')
let client, pool
if (usePool) { pool = createPool({ connectionString: url }); client = await pool.connect() }
else { client = createClient({ connectionString: url }); await client.connect() }

try {
  for (const t of ['exercises', 'exercise_aliases', 'body_parts', 'daytag_defaults', 'gym_lifts_v']) {
    const r = await client.query(`SELECT COUNT(*)::int AS n FROM ${t}`)
    console.log(`  ${t}: ${r.rows[0].n} rows`)
  }
  const sample = await client.query(`
    SELECT canonical_name, body_part_key
    FROM gym_lifts_v
    WHERE body_part_key = 'quads'
    LIMIT 5
  `)
  console.log('\nSample quad exercises from view:')
  sample.rows.forEach(r => console.log(' -', r.canonical_name, '/', r.body_part_key))

  const unresolved = await client.query(`
    SELECT COUNT(DISTINCT exercise)::int AS n
    FROM gym_lifts_v
    WHERE canonical_name IS NULL
  `)
  console.log(`\nUnresolved distinct exercise names in view: ${unresolved.rows[0].n}`)
} finally {
  if (usePool) { client.release(); await pool.end() } else { await client.end() }
}
EOF
node ./verify-migration.mjs
rm ./verify-migration.mjs
```

Expected output:
- `exercises: 49 rows`, `exercise_aliases: 4 rows`, `body_parts: 12 rows`, `daytag_defaults: 3 rows`, `gym_lifts_v: 2168 rows` (or higher if newer lifts).
- Quad sample contains exercises like `Squat`, `Leg Press`, `Leg Extensions`, `Hack Squat` (true quad movers).
- Unresolved distinct exercise names: `0`.

If the unresolved count is non-zero, STOP and report — the alias table may need backfill before continuing.

- [ ] **Step 4: Commit**

```bash
git add db/migrations/2026-05-31-gym-data-unification.sql
git commit -m "$(cat <<'EOF'
feat(db): add gym_lifts_v view and chat-role grants

Creates a read-only view that pre-resolves gym_lifts.exercise to
canonical_name and body_part_key via exercises + exercise_aliases,
and grants SELECT on the four gym reference tables to gym_chat_ro.
The view is the agent's primary muscle-aware lift source.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Catalog allowlist swap and table annotations

**Files:**
- Modify: `lib/gym-chat/catalog.ts`

- [ ] **Step 1: Demonstrate the current discovery surface**

Without changes, the chat endpoint sees only `gym_lifts` and `gym_day_meta`. Confirm:

```bash
grep -n "TABLE_NAME_PATTERN\|FALLBACK_TABLES" lib/gym-chat/catalog.ts | head
```

Expected: `TABLE_NAME_PATTERN = /^gym_/i` at line ~22.

- [ ] **Step 2: Replace the prefix filter with an explicit allowlist**

In `lib/gym-chat/catalog.ts`, replace:

```ts
const TABLE_NAME_PATTERN = /^gym_/i
```

with:

```ts
const GYM_TABLES = new Set([
  'gym_lifts',
  'gym_lifts_v',
  'gym_day_meta',
  'exercises',
  'exercise_aliases',
  'body_parts',
  'daytag_defaults',
])
```

- [ ] **Step 3: Update the catalog discovery query and grouping to use the allowlist**

Find `fetchCatalogFromDatabase()` (currently uses `table_name LIKE 'gym_%'`). Replace its query with a parameterized `= ANY` against the allowlist:

```ts
async function fetchCatalogFromDatabase(): Promise<GymCatalogTable[] | null> {
  const connectionString = resolveConnectionString()
  if (!connectionString) {
    console.warn('gym-chat catalog: missing connection string; using fallback schema.')
    return null
  }

  const allowedNames = Array.from(GYM_TABLES)
  const rows = await runCatalogQueryWithParams<{ table_name: string; column_name: string; data_type: string; udt_name: string }>(
    connectionString,
    `
      SELECT table_name, column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY($1::text[])
      ORDER BY table_name, ordinal_position
    `,
    [allowedNames],
  )
  if (!rows.length) {
    return null
  }
  return groupRowsIntoTables(rows)
}
```

Add a parameterized variant of `runCatalogQuery` next to the existing one (so the original keeps working for other call sites):

```ts
const runCatalogQueryWithParams = async <T extends Record<string, unknown>>(
  connectionString: string,
  query: string,
  params: unknown[],
): Promise<T[]> => {
  if (isPooledConnectionString(connectionString)) {
    const pool = createPool({ connectionString })
    const client = await pool.connect()
    try {
      const result = await client.query<T>(query, params)
      return result.rows ?? []
    } finally {
      client.release()
      await pool.end()
    }
  }
  const client = createClient({ connectionString })
  await client.connect()
  try {
    const result = await client.query<T>(query, params)
    return result.rows ?? []
  } finally {
    await client.end()
  }
}
```

Update `groupRowsIntoTables` to filter by the allowlist instead of the regex:

```ts
const groupRowsIntoTables = (rows: Array<{ table_name: string; column_name: string; data_type: string; udt_name: string }>) => {
  const tableMap = new Map<string, GymCatalogTable>()
  rows.forEach(row => {
    const tableName = row.table_name
    if (!GYM_TABLES.has(tableName)) return
    const entry = tableMap.get(tableName) ?? { name: tableName, columns: [] }
    entry.columns.push({
      name: row.column_name,
      dataType: formatArrayType(row.data_type, row.udt_name),
    })
    tableMap.set(tableName, entry)
  })
  return Array.from(tableMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}
```

- [ ] **Step 4: Extend `FALLBACK_TABLES` with the 5 new tables/view**

The fallback covers the case where `information_schema` is unreachable. Replace the existing `FALLBACK_TABLES` block with the union of all 7 tables/view:

```ts
const FALLBACK_TABLES: GymCatalogTable[] = [
  {
    name: 'gym_lifts',
    columns: [
      { name: 'id', dataType: 'text' },
      { name: 'date', dataType: 'date' },
      { name: 'timestamp', dataType: 'timestamptz' },
      { name: 'exercise', dataType: 'text' },
      { name: 'weight', dataType: 'numeric' },
      { name: 'reps', dataType: 'integer' },
      { name: 'set_number', dataType: 'integer' },
      { name: 'day_tag', dataType: 'text' },
      { name: 'is_unilateral', dataType: 'boolean' },
      { name: 'equipment', dataType: 'text' },
    ],
  },
  {
    name: 'gym_lifts_v',
    columns: [
      { name: 'id', dataType: 'text' },
      { name: 'date', dataType: 'date' },
      { name: 'timestamp', dataType: 'timestamptz' },
      { name: 'exercise', dataType: 'text' },
      { name: 'weight', dataType: 'numeric' },
      { name: 'reps', dataType: 'integer' },
      { name: 'set_number', dataType: 'integer' },
      { name: 'day_tag', dataType: 'text' },
      { name: 'is_unilateral', dataType: 'boolean' },
      { name: 'equipment', dataType: 'text' },
      { name: 'exercise_id', dataType: 'uuid' },
      { name: 'canonical_name', dataType: 'text' },
      { name: 'body_part_key', dataType: 'text' },
    ],
  },
  {
    name: 'gym_day_meta',
    columns: [
      { name: 'date', dataType: 'date' },
      { name: 'day_tag', dataType: 'text' },
      { name: 'body_parts', dataType: 'text[]' },
      { name: 'updated_at', dataType: 'timestamptz' },
    ],
  },
  {
    name: 'exercises',
    columns: [
      { name: 'id', dataType: 'uuid' },
      { name: 'name', dataType: 'text' },
      { name: 'body_part_key', dataType: 'text' },
      { name: 'is_active', dataType: 'boolean' },
      { name: 'created_at', dataType: 'timestamptz' },
      { name: 'updated_at', dataType: 'timestamptz' },
    ],
  },
  {
    name: 'exercise_aliases',
    columns: [
      { name: 'exercise_id', dataType: 'uuid' },
      { name: 'alias', dataType: 'text' },
    ],
  },
  {
    name: 'body_parts',
    columns: [
      { name: 'key', dataType: 'text' },
      { name: 'label', dataType: 'text' },
    ],
  },
  {
    name: 'daytag_defaults',
    columns: [
      { name: 'day_tag', dataType: 'text' },
      { name: 'body_parts', dataType: 'text[]' },
    ],
  },
]
```

- [ ] **Step 5: Extend `TABLE_ANNOTATIONS` with entries for each new table/view**

Replace the existing `TABLE_ANNOTATIONS` block with:

```ts
const TABLE_ANNOTATIONS: Record<string, { purpose: string; notes: string[] }> = {
  gym_lifts: {
    purpose: 'Every logged set. One row per set. Free-form exercise text.',
    notes: [
      'date (date) and timestamp (timestamptz) may both be present. Always normalize with COALESCE(date::date, timestamp::date) AS session_date for day-level grouping, and COALESCE(timestamp::timestamptz, date::timestamptz) AS performed_at for time-ordered sorting.',
      'is_unilateral = true means weight is logged per side — do not double it when computing volume.',
      'Use gym_lifts_v instead for any query that filters or groups by muscle.',
    ],
  },
  gym_lifts_v: {
    purpose: 'gym_lifts pre-joined to exercises and exercise_aliases. Adds exercise_id, canonical_name, body_part_key. Use this for any muscle-aware query.',
    notes: [
      'canonical_name and body_part_key are NULL when an exercise has no matching exercises row or alias — treat as unclassified. Current data has 100% coverage; nulls indicate future drift.',
      'body_part_key values come from body_parts.key (biceps, chest, shoulders, back, triceps, quads, hamstrings, forearms, core, glutes, calves, hips).',
      'Same date/timestamp pattern as gym_lifts: COALESCE(date::date, timestamp::date) AS session_date, COALESCE(timestamp::timestamptz, date::timestamptz) AS performed_at.',
    ],
  },
  gym_day_meta: {
    purpose: 'One row per training day. Stores day-level INTENT (planned muscles).',
    notes: [
      'body_parts is text[] — use UNNEST(body_parts) AS body_part in SELECT/GROUP BY, or EXISTS (SELECT 1 FROM unnest(body_parts) AS bp WHERE bp ILIKE $1) to filter by muscle group.',
      'Use this for "what did I plan to train" questions. Use gym_lifts_v.body_part_key for "what did I actually train" questions.',
      'Join to gym_lifts on: gm.date = COALESCE(gl.date::date, gl.timestamp::date). With the sets CTE: JOIN gym_day_meta gm ON gm.date = sets.session_date.',
    ],
  },
  exercises: {
    purpose: 'Canonical exercise catalog. One row per exercise. body_part_key is authoritative anatomy.',
    notes: [
      'Filter by is_active = true to limit to current programming.',
      'Foreign key: body_part_key -> body_parts.key.',
      'Joined automatically via gym_lifts_v; query directly only when you need exercise-level metadata (e.g. "how many distinct exercises target quads?").',
    ],
  },
  exercise_aliases: {
    purpose: 'Alias text -> canonical exercise. Resolves variations like "RDL" -> "RDLs".',
    notes: [
      'Foreign key: exercise_id -> exercises.id.',
      'gym_lifts_v already resolves these automatically. Query directly only when you need to inspect or list aliases.',
    ],
  },
  body_parts: {
    purpose: 'Reference: the 12 valid body_part_key values and their display labels.',
    notes: [
      'Use this to validate body_part filters and to format keys as user-facing labels.',
    ],
  },
  daytag_defaults: {
    purpose: 'Programmed muscle defaults per day_tag (push/pull/leg). One row per day_tag.',
    notes: [
      'body_parts is text[]. Use to answer "what is supposed to be on a push day?"',
    ],
  },
}
```

- [ ] **Step 6: Type-check**

```bash
npm run build
```

Expected: build succeeds. If you get a `runCatalogQuery` signature mismatch error, double-check that `runCatalogQueryWithParams` is declared at module scope (not inside another function).

- [ ] **Step 7: Commit**

```bash
git add lib/gym-chat/catalog.ts
git commit -m "$(cat <<'EOF'
refactor(gym-chat): swap prefix filter for explicit table allowlist

Catalog discovery now exposes gym_lifts, gym_lifts_v, gym_day_meta,
exercises, exercise_aliases, body_parts, and daytag_defaults to the
chat agent. Adds purpose-and-notes annotations for each table that
steer the model toward gym_lifts_v for muscle-aware queries.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Re-source `getBodyPartsContext()` from the `body_parts` table

**Files:**
- Modify: `lib/gym-chat/catalog.ts`

- [ ] **Step 1: Replace the body-parts fetch to read from `body_parts` (key + label)**

Find `fetchBodyPartsFromDatabase()` in `lib/gym-chat/catalog.ts` and replace its query and the cache type. The function shape stays the same; only the query changes.

Replace the existing block:

```ts
let cachedBodyParts: string[] = []
```

with:

```ts
type BodyPartEntry = { key: string; label: string }
let cachedBodyParts: BodyPartEntry[] = []
```

Replace the body of `fetchBodyPartsFromDatabase`:

```ts
async function fetchBodyPartsFromDatabase(): Promise<BodyPartEntry[]> {
  const connectionString = resolveConnectionString()
  if (!connectionString) return []

  const rows = await runCatalogQuery<{ key: string; label: string }>(
    connectionString,
    `SELECT key, label FROM body_parts ORDER BY key`,
  )
  return rows.map(r => ({ key: r.key, label: r.label })).filter(e => e.key)
}
```

Update `loadBodyParts` and `getBodyPartsContext`:

```ts
export async function loadBodyParts(options?: { force?: boolean }) {
  const now = Date.now()
  if (!options?.force && now < bodyPartsCacheExpiresAt && cachedBodyParts.length) {
    return cachedBodyParts
  }
  if (bodyPartsLoadingPromise) return bodyPartsLoadingPromise

  bodyPartsLoadingPromise = (async () => {
    try {
      const parts = await fetchBodyPartsFromDatabase()
      if (parts.length) {
        cachedBodyParts = parts
        bodyPartsCacheExpiresAt = Date.now() + TABLE_CACHE_TTL_MS
      } else {
        bodyPartsCacheExpiresAt = Date.now() + ERROR_CACHE_TTL_MS
      }
    } catch (error) {
      bodyPartsCacheExpiresAt = Date.now() + ERROR_CACHE_TTL_MS
      console.error('gym-chat body-parts catalog: failed to load.', error)
    }
    return cachedBodyParts
  })()

  try {
    return await bodyPartsLoadingPromise
  } finally {
    bodyPartsLoadingPromise = null
  }
}

export const getBodyPartsContext = (): string => {
  if (!cachedBodyParts.length) return ''
  const formatted = cachedBodyParts.map(p => `${p.key} (${p.label})`).join(', ')
  return `Valid body_part_key values (use these verbatim in WHERE/EXISTS filters and gym_lifts_v.body_part_key comparisons):\n${formatted}`
}
```

`bodyPartsLoadingPromise` should be typed as `Promise<BodyPartEntry[]> | null`. Update the existing declaration:

```ts
let bodyPartsLoadingPromise: Promise<BodyPartEntry[]> | null = null
```

- [ ] **Step 2: Type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add lib/gym-chat/catalog.ts
git commit -m "$(cat <<'EOF'
refactor(gym-chat): source body-part values from body_parts table

getBodyPartsContext() now reads key+label from the canonical body_parts
reference table instead of unnesting gym_day_meta.body_parts. Includes
the user-facing label alongside the key so the agent can format
responses consistently.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Delete the session-co-occurrence exercise hack

**Files:**
- Modify: `lib/gym-chat/catalog.ts`

- [ ] **Step 1: Remove `ExerciseEntry`, `loadExerciseCatalog`, `getExerciseContext`, and supporting state**

In `lib/gym-chat/catalog.ts`, delete:

- The comment block `// Exercise pre-fetch — loads distinct exercises + body-part mapping from DB ...`
- The `ExerciseRow` type
- The `ExerciseEntry` type export
- `cachedExercises`, `exerciseCacheExpiresAt`, `exerciseLoadingPromise` state declarations
- The `EXERCISE_CACHE_TTL_MS` constant
- The `fetchExercisesFromDatabase` function
- The `loadExerciseCatalog` function (and its export)
- The `getExerciseContext` function (and its export)

The block to remove starts after the `getFallbackCatalog` export and ends just before the `// Body-parts pre-fetch — ...` comment that opens the section you edited in Task 3.

- [ ] **Step 2: Type-check**

```bash
npm run build
```

Expected: build FAILS with `Cannot find name 'loadExerciseCatalog'` or `'getExerciseContext'` in `app/api/gym-chat/route.ts`. This is the trigger for Task 5.

- [ ] **Step 3: Commit (broken build allowed — fixed in next task)**

Do NOT commit yet. Continue directly to Task 5 so the build is fixed in the same commit chain. The next task's commit will cover this file too.

---

## Task 5: Update `route.ts` system prompt and drop dead imports

**Files:**
- Modify: `app/api/gym-chat/route.ts`

- [ ] **Step 1: Remove the imports for the deleted catalog helpers**

In `app/api/gym-chat/route.ts`, change the import line that currently reads:

```ts
import { getCatalogContext, getExerciseContext, getBodyPartsContext, loadExerciseCatalog, loadBodyParts, loadGymCatalog } from '@/lib/gym-chat/catalog'
```

to:

```ts
import { getCatalogContext, getBodyPartsContext, loadBodyParts, loadGymCatalog } from '@/lib/gym-chat/catalog'
```

- [ ] **Step 2: Remove `loadExerciseCatalog()` from the startup load**

Find:

```ts
await Promise.all([loadGymCatalog(), loadExerciseCatalog(), loadBodyParts()]).catch(() => undefined)
```

Replace with:

```ts
await Promise.all([loadGymCatalog(), loadBodyParts()]).catch(() => undefined)
```

- [ ] **Step 3: Drop `exerciseContext` from `buildSystemPrompt`**

Locate the `buildSystemPrompt` function. Remove the line `const exerciseContext = getExerciseContext()` and the trailing `${exerciseContext ? ... }` block.

Replace the body of the template literal between `## SQL Patterns` and `## Tool Results` so it now reads:

```ts
return `You are a no-nonsense bodybuilding coach with access to the user's complete workout history in a PostgreSQL database. You think in terms of progressive overload, volume landmarks, frequency, and long-term adaptation. You don't hype — you analyze. When the data shows real progress, acknowledge it. When there's a stall, an imbalance, or a gap in training, call it out plainly and say what should change. Your job is to help the user train smarter, not to make them feel good about mediocre results.

## Database Schema
${catalogContext}

## Metric Definitions & Data Scope
${capabilities}

## SQL Patterns
${semanticHints}
${bodyPartsContext ? `\n## Available Body Part Values\n${bodyPartsContext}` : ''}

## Tool Results
When you call execute_gym_query, the tool returns:
{ "queries": [ { "id": "q1", "purpose": "...", "rowCount": N, "rows": [...], "error": null | "..." } ] }

- rows contains up to 20 preview rows; rowCount is the total.
- Never cite a query with a non-null error.
- If rowCount is 0 and the query filtered on an exercise name, run a follow-up to discover the canonical name: SELECT name FROM exercises WHERE name ILIKE $1 (or query exercise_aliases.alias). Use a broad wildcard like '%bench%'. If matches are found, list them and ask which was intended.

## SQL Rules
- SELECT only. No INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, UNION, VALUES, or recursive CTEs.
- Use exact table and column names from the schema. Never SELECT *.
- No schema-qualified table names (gym_lifts, not public.gym_lifts).
- ALL string values in WHERE, HAVING, or JOIN conditions must use $1..$n parameterized placeholders — exercise names, day tags, body parts, LIKE patterns, everything. No literal strings in SQL.
- Relative time windows: CURRENT_DATE - ($1)::interval (never INTERVAL $1).
- No FILTER aggregates or explicit window frames (ROWS BETWEEN / RANGE BETWEEN). Use CASE expressions and default window frames.
- Muscle-aware queries (volume by muscle, exercises targeting a muscle, top sets per muscle): query gym_lifts_v and filter or group on body_part_key. Use raw gym_lifts only when anatomy is irrelevant.
- Session-intent queries (which muscles were planned for a day, push/pull/leg): use gym_day_meta.body_parts (text[]) with UNNEST(body_parts) AS body_part. This is INTENT, not what was actually logged.
- Default time windows: set-level queries = last 90 days; trend/weekly/monthly = last 12 months. These are enforced server-side if omitted.
- All-time queries: prepend /*policy:time_window=all_time*/ before the SELECT.
- session_date and performed_at are NOT columns in gym_lifts or gym_lifts_v — they are aliases defined only inside the sets CTE. Any query that filters, groups, or orders by date MUST define the sets CTE first. Wrong: FROM gym_lifts_v WHERE session_date >= ... (column does not exist). Right: WITH sets AS (...) SELECT ... FROM sets WHERE sets.session_date >= ...
- Always use the shared sets CTE for date-aware queries against gym_lifts: WITH sets AS (SELECT exercise, weight, reps, COALESCE(date::date, timestamp::date) AS session_date, COALESCE(timestamp::timestamptz, date::timestamptz) AS performed_at FROM gym_lifts)
- Sets CTE for date-aware queries against gym_lifts_v: WITH sets AS (SELECT canonical_name, body_part_key, exercise_id, weight, reps, COALESCE(date::date, timestamp::date) AS session_date, COALESCE(timestamp::timestamptz, date::timestamptz) AS performed_at FROM gym_lifts_v)
- CTE scoping: only reference the CTE alias in outer queries. Never reference gym_lifts or gym_lifts_v outside the CTE when date aliases are needed.
- Apply date filters in the CTE, not the outer query (unless using sets.session_date directly).
- Default row limit: 200. Hard limit: 1000. Top-N: use ORDER BY + LIMIT N.
- Query timeout: 2 seconds.

## How to Respond
- Answer directly. Match depth to the question — 1–2 sentences for simple lookups, real analysis for complex ones.
- Cite inline when using query data: "You hit 12 sets this week [q1]." Every specific number needs a citation.
- Interpret the data like a coach reviewing film. A plateau isn't just "volume was flat" — say what's stalling and what to adjust. A PR isn't just "weight went up" — say whether the rate of progress is on track or needs to accelerate. Connect the numbers to what they mean for long-term adaptation.
- If data is missing or a query fails, say what's missing and what would be needed to answer properly.
- Call execute_gym_query only when you need actual data. General fitness and programming questions don't need a query.
- For questions needing multiple metrics, include them as multiple queries in one tool call.
- This is a gym and fitness assistant. For questions unrelated to fitness or training, briefly say so.
- When the user asks for a chart ("show me a chart", "give me a bar chart", etc.), keep the text response to 1-2 sentences max. The chart renders automatically — do not narrate data that is already visible in the chart.

## Conversation
You have full conversation history — use it. References like "that exercise" or "last session" resolve from context. If something is genuinely ambiguous and context doesn't help, ask one short question. Otherwise pick the most reasonable interpretation and proceed.

Timezone: ${timezone}`
```

Compared to the previous version, the substantive changes are: removed the `## Exercise Reference` section, removed the `Exercises by body part` SQL Rule that warned against co-occurrence, removed the `body_parts: UNNEST(...)` SQL Rule (now handled in the Session-intent rule), added a Muscle-aware SQL Rule pointing at `gym_lifts_v`, added a Session-intent SQL Rule pointing at `gym_day_meta`, added a `gym_lifts_v` sets-CTE example, and pointed the rowCount-zero fallback at `exercises` / `exercise_aliases`.

- [ ] **Step 4: Type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit (combined with Task 4's deletion)**

```bash
git add lib/gym-chat/catalog.ts app/api/gym-chat/route.ts
git commit -m "$(cat <<'EOF'
refactor(gym-chat): drop session-co-occurrence anatomy hack

Removes loadExerciseCatalog/getExerciseContext and the Exercise
Reference section of the system prompt. The agent now learns
exercise->muscle mapping from the gym_lifts_v view and the
exercises table directly. Adds Muscle-aware and Session-intent
SQL rules that point at gym_lifts_v and gym_day_meta respectively,
and adds a sets-CTE example for gym_lifts_v.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Rewrite SQL patterns in `semantics.ts`

**Files:**
- Modify: `lib/gym-chat/semantics.ts`

- [ ] **Step 1: Replace the muscle-related entries and add the two new patterns**

Open `lib/gym-chat/semantics.ts`. Replace the entire `SEMANTIC_MAPPINGS` array with the version below. The non-muscle entries (volume, weekly sets, sessions, estimated 1RM, PR, best set(s), set breakdown, per-exercise summary, exercise progression trend, push day, progressive overload streak, overall progress, exercise name lookup) are kept as-is.

```ts
const SEMANTIC_MAPPINGS = [
  {
    phrase: 'volume',
    sql: 'SUM(weight * reps)',
  },
  {
    phrase: 'weekly sets',
    sql: "COUNT(*) grouped by DATE_TRUNC('week', date)",
  },
  {
    phrase: 'sessions',
    sql: 'COUNT(DISTINCT date::date)',
  },
  {
    phrase: 'estimated 1RM',
    sql: 'ROUND(weight * (1 + reps / 30.0))',
  },
  {
    phrase: 'PR',
    sql: 'MAX(weight) unless phrasing explicitly calls for estimated 1RM',
  },
  {
    phrase: 'best set(s)',
    sql: 'Use a sets CTE. Order by weight (or estimated 1RM if requested), return exercise, weight, reps, and session_date, then LIMIT N.',
  },
  {
    phrase: 'set breakdown / within-session fatigue',
    sql:
      "Use a sets CTE. Compute set_order with COALESCE(set_number, ROW_NUMBER() OVER (PARTITION BY session_date, exercise ORDER BY performed_at)). Bucket with NTILE(3) over set_order to compare early/mid/late averages, and surface best vs worst sets by weight or estimated 1RM.",
  },
  {
    phrase: 'per-exercise summary',
    sql: 'Use a sets CTE. Aggregate COUNT(*) AS total_sets, SUM(weight*reps) AS total_volume, MAX(session_date) AS last_performed_date, plus a best-set subquery via ROW_NUMBER() OVER (PARTITION BY exercise ORDER BY weight DESC, reps DESC).',
  },
  {
    phrase: 'exercise progression trend',
    sql: 'Use a sets CTE. Compute per-session max estimated 1RM per exercise, then aggregate weekly or monthly averages (DATE_TRUNC) and ORDER BY exercise, period_start.',
  },
  {
    phrase: 'push day / pull day / leg day',
    sql: "day_tag ILIKE 'push%' / 'pull%' / 'leg%'",
  },
  {
    phrase: 'session-intent body parts (planned muscles for a day)',
    sql:
      "Use gym_day_meta.body_parts (text array). Filter with EXISTS (SELECT 1 FROM unnest(body_parts) AS bp WHERE bp ILIKE $1) or body_parts @> ARRAY[$1::text]. For top planned body part, use UNNEST(body_parts) AS body_part and COUNT(*) grouped by body_part. This is INTENT only; for actually-logged muscles, use gym_lifts_v.body_part_key.",
  },
  {
    phrase: 'exercises for a body part / bicep exercises / chest exercises / exercises by muscle',
    sql:
      "Query gym_lifts_v with body_part_key. canonical_name and body_part_key are pre-resolved via exercises + exercise_aliases. Example:\n" +
      "WITH sets AS (SELECT canonical_name, body_part_key, weight, reps, COALESCE(date::date, timestamp::date) AS session_date FROM gym_lifts_v)\n" +
      "SELECT canonical_name AS exercise, SUM(weight * reps) AS volume\n" +
      "FROM sets\n" +
      "WHERE session_date >= CURRENT_DATE - ($1)::interval\n" +
      "  AND body_part_key = $2\n" +
      "GROUP BY canonical_name\n" +
      "ORDER BY volume DESC\n" +
      "params: ['1 month', 'quads']. Use the body_part_key values listed under Available Body Part Values. Do NOT hand-list exercise names or use ILIKE OR; the view does the classification.",
  },
  {
    phrase: 'top sets by body part',
    sql:
      "Use a sets CTE against gym_lifts_v. Rank by weight with ROW_NUMBER() OVER (PARTITION BY body_part_key ORDER BY weight DESC). Filter to row_number = 1 per body_part_key, then ORDER BY weight DESC LIMIT N. Example:\n" +
      "WITH sets AS (SELECT canonical_name, body_part_key, weight, reps, COALESCE(date::date, timestamp::date) AS session_date FROM gym_lifts_v WHERE body_part_key IS NOT NULL),\n" +
      "ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY body_part_key ORDER BY weight DESC) AS rn FROM sets WHERE session_date >= CURRENT_DATE - ($1)::interval)\n" +
      "SELECT body_part_key, canonical_name, weight, reps, session_date FROM ranked WHERE rn = 1 ORDER BY weight DESC LIMIT $2",
  },
  {
    phrase: 'weekly muscle group volume comparison',
    sql:
      "Use gym_lifts_v.body_part_key (actually logged muscles), not gym_day_meta.body_parts (planned intent). Example:\n" +
      "WITH sets AS (SELECT body_part_key, weight, reps, COALESCE(date::date, timestamp::date) AS session_date, COALESCE(timestamp::timestamptz, date::timestamptz) AS performed_at FROM gym_lifts_v WHERE body_part_key IS NOT NULL),\n" +
      "base AS (SELECT DATE_TRUNC('week', performed_at)::date AS week_start, body_part_key, SUM(weight * reps) AS volume FROM sets WHERE performed_at >= CURRENT_DATE - ($1)::interval GROUP BY week_start, body_part_key),\n" +
      "recent AS (SELECT body_part_key, AVG(volume) AS avg_recent FROM base WHERE week_start >= CURRENT_DATE - ($2)::interval GROUP BY body_part_key),\n" +
      "prior AS (SELECT body_part_key, AVG(volume) AS avg_prior FROM base WHERE week_start < CURRENT_DATE - ($2)::interval AND week_start >= CURRENT_DATE - ($3)::interval GROUP BY body_part_key)\n" +
      "SELECT COALESCE(recent.body_part_key, prior.body_part_key) AS body_part_key, avg_recent, avg_prior, CASE WHEN avg_prior IS NULL OR avg_prior = 0 THEN NULL ELSE (avg_recent - avg_prior) / avg_prior END AS pct_change, CASE WHEN avg_prior IS NULL OR avg_prior = 0 THEN false ELSE ABS((avg_recent - avg_prior) / avg_prior) >= 0.15 END AS flagged\n" +
      "FROM recent FULL JOIN prior ON recent.body_part_key = prior.body_part_key ORDER BY pct_change DESC NULLS LAST",
  },
  {
    phrase: 'session intent vs logged (planned muscles vs actually trained)',
    sql:
      "Compare gym_day_meta.body_parts (planned) to distinct gym_lifts_v.body_part_key per session_date (actually logged). Surfaces gaps like 'push day with no shoulder work.' Example:\n" +
      "WITH sets AS (SELECT body_part_key, COALESCE(date::date, timestamp::date) AS session_date FROM gym_lifts_v WHERE body_part_key IS NOT NULL),\n" +
      "logged AS (SELECT session_date, ARRAY_AGG(DISTINCT body_part_key ORDER BY body_part_key) AS logged_parts FROM sets WHERE session_date >= CURRENT_DATE - ($1)::interval GROUP BY session_date)\n" +
      "SELECT gm.date, gm.day_tag, gm.body_parts AS planned_parts, COALESCE(l.logged_parts, ARRAY[]::text[]) AS logged_parts, (SELECT ARRAY_AGG(p) FROM unnest(gm.body_parts) p WHERE p <> ALL(COALESCE(l.logged_parts, ARRAY[]::text[]))) AS planned_not_logged, (SELECT ARRAY_AGG(p) FROM unnest(COALESCE(l.logged_parts, ARRAY[]::text[])) p WHERE p <> ALL(gm.body_parts)) AS logged_not_planned\n" +
      "FROM gym_day_meta gm LEFT JOIN logged l ON l.session_date = gm.date\n" +
      "WHERE gm.date >= CURRENT_DATE - ($1)::interval\n" +
      "ORDER BY gm.date DESC",
  },
  {
    phrase: 'day_tag defaults (what is supposed to be on a push/pull/leg day)',
    sql:
      "Query daytag_defaults directly. Example:\n" +
      "SELECT day_tag, body_parts FROM daytag_defaults WHERE day_tag ILIKE $1\n" +
      "params: ['push%']",
  },
  {
    phrase: 'progressive overload streak',
    sql:
      "WITH sets AS (SELECT exercise, weight, reps, COALESCE(date::date, timestamp::date) AS session_date, COALESCE(timestamp::timestamptz, date::timestamptz) AS performed_at FROM gym_lifts), session_best AS (SELECT session_date, exercise, MAX(weight * (1 + reps / 30.0)) AS est_1rm FROM sets WHERE performed_at >= CURRENT_DATE - ($1)::interval GROUP BY session_date, exercise), deltas AS (SELECT session_date, exercise, est_1rm, LAG(est_1rm) OVER (PARTITION BY exercise ORDER BY session_date) AS prev_1rm, (est_1rm - LAG(est_1rm) OVER (PARTITION BY exercise ORDER BY session_date)) AS delta FROM session_best), streaks AS (SELECT session_date, exercise, est_1rm, prev_1rm, delta, CASE WHEN delta > 0 THEN 1 ELSE 0 END AS is_increase, SUM(CASE WHEN delta <= 0 OR delta IS NULL THEN 1 ELSE 0 END) OVER (PARTITION BY exercise ORDER BY session_date) AS break_id FROM deltas), streak_groups AS (SELECT exercise, break_id, MIN(CASE WHEN is_increase = 1 THEN session_date END) AS streak_start, MAX(CASE WHEN is_increase = 1 THEN session_date END) AS streak_end, SUM(CASE WHEN is_increase = 1 THEN 1 ELSE 0 END) AS streak_len FROM streaks GROUP BY exercise, break_id), breaks AS (SELECT exercise, break_id, MIN(session_date) AS break_date FROM streaks WHERE is_increase = 0 GROUP BY exercise, break_id) SELECT g.exercise, g.streak_len, g.streak_start, g.streak_end, b.break_date FROM streak_groups g LEFT JOIN breaks b ON b.exercise = g.exercise AND b.break_id = g.break_id + 1 ORDER BY g.streak_len DESC NULLS LAST LIMIT 1.",
  },
  {
    phrase: 'overall progress / general summary',
    sql: "Run multiple queries: (1) WITH sets AS (SELECT COALESCE(date::date, timestamp::date) AS session_date FROM gym_lifts) SELECT COUNT(DISTINCT session_date) AS session_count FROM sets; (2) SELECT COUNT(*) AS total_sets, SUM(weight * reps) AS total_volume FROM gym_lifts; (3) SELECT exercise, COUNT(*) AS set_count FROM gym_lifts GROUP BY exercise ORDER BY set_count DESC LIMIT 5. Note: queries (2) and (3) access gym_lifts directly only because they do not reference session_date or performed_at aliases — direct gym_lifts access is only valid when no date column alias is needed. Present these as a holistic training snapshot.",
  },
  {
    phrase: 'exercise name lookup / fuzzy search',
    sql: "Query the canonical catalog first: SELECT name FROM exercises WHERE name ILIKE $1. Fall back to aliases: SELECT e.name FROM exercise_aliases a JOIN exercises e ON e.id = a.exercise_id WHERE a.alias ILIKE $1. Use broad wildcards (e.g., '%bench%').",
  },
] as const
```

Compared to the previous version, the substantive changes are: removed the `body parts` and `exercises for a body part / ...` entries and replaced them with the `gym_lifts_v`-based equivalents; replaced `top sets by body part` and `weekly muscle group volume comparison` to use `gym_lifts_v.body_part_key`; added new `session intent vs logged` and `day_tag defaults` entries; rewrote `exercise name lookup / fuzzy search` to query `exercises` / `exercise_aliases` directly.

- [ ] **Step 2: Type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add lib/gym-chat/semantics.ts
git commit -m "$(cat <<'EOF'
refactor(gym-chat): rewrite muscle SQL patterns to use gym_lifts_v

Muscle-aware patterns now point at gym_lifts_v.body_part_key instead
of hand-listed ILIKE OR over guessed exercise names. Adds two new
patterns: session intent vs logged (gym_day_meta vs gym_lifts_v)
and day_tag defaults. Exercise name lookup now queries the
exercises / exercise_aliases tables directly.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update `capabilities.ts` data dictionary

**Files:**
- Modify: `lib/gym-chat/capabilities.ts`

- [ ] **Step 1: Replace the three text blocks with the unified-data versions**

Replace the entire contents of `lib/gym-chat/capabilities.ts` with:

```ts
const METRIC_GLOSSARY = `Metric glossary:
- session: a training day (distinct date) with at least one row in gym_lifts.
- set: a single logged set with exercise, weight, reps, and set_number.
- volume: SUM(weight * reps); unit corresponds to logged weight units (typically lb-reps).
- weekly volume: volume aggregated by DATE_TRUNC('week', date::date).
- monthly volume: volume aggregated by DATE_TRUNC('month', date::date).
- estimated 1RM: ROUND(weight * (1 + reps / 30.0)).
- PR: highest observed weight for an exercise unless the user explicitly asks for estimated 1RM.
- best set: heaviest set for an exercise (or highest estimated 1RM if requested).
- set-level fatigue: compare early vs late sets within a session using set_number buckets (thirds).
- per-exercise summary: total sets, total volume, last performed date, and best set per exercise.
- planned body parts: gym_day_meta.body_parts (text[]) — what the user intended to train that day.
- logged body parts: gym_lifts_v.body_part_key — what they actually trained, resolved via exercises + exercise_aliases.
- split/day_tag: strings like push, pull, leg, upper, lower stored on each set via day_tag.
`

const DATA_SCOPE = `Data scope and limitations:
- All tables live in the public schema and are read-only.
- gym_lifts: every logged set (id, date, timestamp, exercise text, weight, reps, set_number, equipment, is_unilateral, day_tag).
- gym_lifts_v: gym_lifts pre-joined to exercises and exercise_aliases. Adds exercise_id, canonical_name, body_part_key. Use this for any muscle-aware query.
- gym_day_meta: per-day metadata (date, day_tag, body_parts text[], updated_at). body_parts is INTENT — what was planned, not necessarily what was logged.
- exercises: canonical exercise catalog (id, name, body_part_key, is_active). body_part_key is authoritative anatomy.
- exercise_aliases: alias -> exercise_id mapping. Resolves text variations like "RDL" -> "RDLs".
- body_parts: the 12 valid body_part_key values and their display labels.
- daytag_defaults: programmed muscle defaults for each day_tag (e.g. push day -> chest+biceps+shoulders).
- There is no direct tracking of RPE, rest times, heart rate, subjective fatigue, injuries, or future plans.
- The agent may discuss goals and programming in general when logs are not required.
- When logs are absent for a claim, the agent must say so and use general best practices.
- The agent must state when a requested attribute does not exist and pivot to measurable proxies (sets, sessions, volume, rep ranges, body_part_key, trends).
- For log-backed analysis, reasoning must stay within historical data; planning/future suggestions should be grounded in observed patterns.
`

const ANALYSIS_PATTERNS = `Helpful analysis patterns:
- Consistency: Use a sets CTE. COUNT(DISTINCT session_date) per week/month, or EXTRACT(DOW FROM session_date::date) for weekday breakdown.
- Period comparisons: compare recent vs prior windows for sessions/sets/volume; compute streaks, gaps, and missed weeks/months from session dates.
- Balance: compare body_part_key exposure or day_tag counts between recent windows and lifetime/all-time. Use gym_lifts_v.body_part_key for actually-logged muscles, gym_day_meta.body_parts for planned intent.
- Progression: track estimated 1RM or top weights per exercise over time.
- Within-session drop-off: bucket set_number into early/mid/late and compare average load/reps to quantify fatigue.
- Volume mix: break volume or set counts by canonical_name, body_part_key, day_tag, equipment, or rep band buckets (<=5, 6-8, 9-12, 13-15, 16+).
- Planning intent: identify under-trained areas, stalled lifts, or inconsistent days, then recommend focus areas using historical gaps.
- Intent vs reality: join gym_day_meta to gym_lifts_v to surface days where planned body_parts diverge from logged body_part_key sets.
`

export const getCapabilitiesContext = () => {
  return [METRIC_GLOSSARY.trim(), DATA_SCOPE.trim(), ANALYSIS_PATTERNS.trim()].join('\n\n')
}
```

- [ ] **Step 2: Type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add lib/gym-chat/capabilities.ts
git commit -m "$(cat <<'EOF'
docs(gym-chat): extend capabilities dictionary with unified tables

Adds exercises, exercise_aliases, body_parts, daytag_defaults, and
gym_lifts_v to the data-scope block. Distinguishes planned body
parts (gym_day_meta) from logged body parts (gym_lifts_v) in the
glossary and analysis patterns.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Update `CLAUDE.md` gotchas

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace the obsolete gym-chat anatomy notes**

In `CLAUDE.md`, replace this line:

```
- **Gym chat — `body_parts` is session-level, not exercise-level:** `gym_day_meta.body_parts` tags which muscles were trained that day, not which exercises target which muscles. Co-occurrence SQL (JOIN gym_lifts to gym_day_meta and count body_part appearances per exercise) breaks completely when multiple muscles are always trained together — every exercise gets identical counts. For "exercises by muscle" queries, the model must use its anatomy knowledge + the Exercise Reference catalog, then filter by exercise name.
```

with:

```
- **Gym chat — `gym_lifts_v` is the muscle-aware view:** Created in `db/migrations/2026-05-31-gym-data-unification.sql`. Pre-resolves `canonical_name` and `body_part_key` via `exercises` + `exercise_aliases`. All muscle-aware SQL patterns query the view; raw `gym_lifts` is for anatomy-irrelevant queries only. `gym_day_meta.body_parts` is session INTENT (planned), distinct from `gym_lifts_v.body_part_key` (actually logged) — both are useful for different questions.
```

Then remove this line entirely (it's obsolete once the Exercise Reference is gone):

```
- **Gym chat — Exercise Reference header is load-bearing:** `getExerciseContext()` in `lib/gym-chat/catalog.ts` emits a header that must explicitly disclaim exercise tags (e.g. `RDLs [quads/hamstrings]`) as session-day metadata, NOT anatomy data. If the header weakens (e.g. reverts to "top muscle group(s) by co-occurrence"), the model will classify Leg Press as a hamstring exercise and RDLs as a quad exercise. The anatomy rule in `semantics.ts` is not sufficient on its own — the catalog header must reinforce it.
```

Update this line to reflect the new body-parts source:

```
- **Gym chat — body_part values injected at startup:** `loadBodyParts()` in `lib/gym-chat/catalog.ts` queries `SELECT DISTINCT UNNEST(body_parts) FROM gym_day_meta` and caches the result. `getBodyPartsContext()` formats it for the system prompt as `## Available Body Part Values`. Called alongside `loadGymCatalog()` and `loadExerciseCatalog()` in `route.ts`. This prevents the model from guessing body_part filter values that don't exist.
```

becomes:

```
- **Gym chat — body_part values injected at startup:** `loadBodyParts()` in `lib/gym-chat/catalog.ts` queries `SELECT key, label FROM body_parts` and caches the result. `getBodyPartsContext()` formats it for the system prompt as `## Available Body Part Values` (e.g. `quads (Quads), hamstrings (Hamstrings), ...`). Called alongside `loadGymCatalog()` in `route.ts`. This prevents the model from guessing body_part filter values that don't exist.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: refresh gym-chat gotchas for the unified data model

Removes the Exercise Reference load-bearing-header gotcha (the header
is gone), replaces the session-level body_parts caveat with a
gym_lifts_v pointer, and updates the body_parts-injection gotcha to
reflect the new body_parts table source.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: End-to-end verification

**Files:**
- No file changes; this task verifies behavior.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev > /tmp/gymchat-dev.log 2>&1 &
sleep 8
grep -E "ready|error|Local:" /tmp/gymchat-dev.log | head -5
```

Note the port (3000 or 3002). Export it for the rest of the task:

```bash
PORT=$(grep -oE 'localhost:[0-9]+' /tmp/gymchat-dev.log | head -1 | cut -d: -f2)
echo "Using port $PORT"
```

- [ ] **Step 2: Verify quad query returns only true quad exercises**

```bash
curl -s -X POST "http://localhost:$PORT/api/gym-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "what are my quad exercises by volume in the last month?"}], "client": {"timezone": "America/New_York"}}' \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('=== ASSISTANT ==='); print(data.get('assistantMessage', ''))
for q in data.get('queries', []):
    print('Params:', q.get('params'))
    print('SQL:', q.get('sql', '')[:300])
    print('Exercises:', [r.get('exercise') or r.get('canonical_name') for r in q.get('previewRows', [])])
"
```

Expected: SQL references `gym_lifts_v` and `body_part_key = 'quads'`. Result rows include only true quad exercises (Squat variants, Leg Press, Leg Extensions, Hack Squat, Lunges). No RDLs, no Leg Curls, no Calf Raises.

- [ ] **Step 3: Verify hamstring query returns only true hamstring exercises**

```bash
curl -s -X POST "http://localhost:$PORT/api/gym-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "show me my hamstring exercises by volume in the last month"}], "client": {"timezone": "America/New_York"}}' \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('=== ASSISTANT ==='); print(data.get('assistantMessage', ''))
for q in data.get('queries', []):
    print('SQL:', q.get('sql', '')[:300])
    print('Exercises:', [r.get('exercise') or r.get('canonical_name') for r in q.get('previewRows', [])])
"
```

Expected: only RDLs and Leg Curl variants. No Leg Press, no Hack Squat, no Squat.

- [ ] **Step 4: Verify alias resolution**

```bash
curl -s -X POST "http://localhost:$PORT/api/gym-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "what did I do on RDL last week?"}], "client": {"timezone": "America/New_York"}}' \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('=== ASSISTANT ==='); print(data.get('assistantMessage', ''))
for q in data.get('queries', []):
    print('Rows:', q.get('rowCount'))
"
```

Expected: the agent resolves "RDL" to the "RDLs" canonical exercise (via `exercise_aliases`) and returns rows.

- [ ] **Step 5: Verify intent-vs-logged pattern is reachable**

```bash
curl -s -X POST "http://localhost:$PORT/api/gym-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "what muscles did I plan vs actually train this week?"}], "client": {"timezone": "America/New_York"}}' \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('=== ASSISTANT ==='); print(data.get('assistantMessage', ''))
for q in data.get('queries', []):
    print('SQL:', q.get('sql', '')[:400])
    print('Rows:', q.get('rowCount'))
"
```

Expected: SQL joins `gym_day_meta` to `gym_lifts_v` and surfaces planned vs logged body parts per session.

- [ ] **Step 6: Verify form write path still works**

In a browser, open `http://localhost:$PORT/dashboards/gym`, click into "Log Workout" (password gated), log a single test set (pick any exercise from the dropdown, weight, reps, equipment). Confirm it appears in the dashboard.

Then verify the new lift is visible through the view:

```bash
cat > ./check-view.mjs <<'EOF'
import fs from 'node:fs'
import { createClient, createPool } from '@vercel/postgres'
const env = fs.readFileSync('.env.local', 'utf8')
env.split('\n').forEach(line => { const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i); if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '') })
const url = process.env.GYM_CHAT_DATABASE_URL_READONLY
const usePool = url.includes('-pooler.')
let client, pool
if (usePool) { pool = createPool({ connectionString: url }); client = await pool.connect() }
else { client = createClient({ connectionString: url }); await client.connect() }
const r = await client.query(`SELECT canonical_name, body_part_key, weight, reps FROM gym_lifts_v ORDER BY COALESCE(timestamp::timestamptz, date::timestamptz) DESC LIMIT 5`)
r.rows.forEach(row => console.log(row))
if (usePool) { client.release(); await pool.end() } else { await client.end() }
EOF
node ./check-view.mjs
rm ./check-view.mjs
```

Expected: the test set you just logged appears with non-NULL `canonical_name` and `body_part_key`.

- [ ] **Step 7: Stop the dev server**

```bash
pkill -f "next dev" || true
```

- [ ] **Step 8: Final production-build check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 9: No additional commits**

This task is verification only. If any check fails, return to the failing task, fix, and re-verify.

---

## Self-review against spec

- [x] **Section "Database changes":** Task 1 (script created, run, verified, committed).
- [x] **Section "Catalog layer" — allowlist + annotations + fallback:** Task 2.
- [x] **Section "Catalog layer" — re-source body_parts:** Task 3.
- [x] **Section "Catalog layer" — delete co-occurrence hack:** Task 4, paired with Task 5 to keep build green.
- [x] **Section "System prompt":** Task 5.
- [x] **Section "SQL patterns":** Task 6 — pattern rewrites and additions.
- [x] **Section "Capabilities":** Task 7.
- [x] **Section "Verification":** Task 9 exercises every behavior check listed in the spec.
- [x] **Section "Files touched" — CLAUDE.md:** Task 8.
- [x] **Section "Files touched" — sql-policy.ts:** intentionally untouched (allowlist propagates).
- [x] **Section "Risks & mitigations" — catalog cache:** Tasks 5 and 9 implicitly cover this; the dev-server restart in Task 9 ensures cache is fresh.
- [x] **Section "Non-goals" — no form/schema/migration tooling changes:** plan does not modify `actions.ts`, `WorkoutForm.tsx`, `ExerciseManagerModal.tsx`, or `gym_lifts` schema.

No gaps identified.
