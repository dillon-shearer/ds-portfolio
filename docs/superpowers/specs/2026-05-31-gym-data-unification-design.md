# Gym Data Unification for the Chat Agent

**Date:** 2026-05-31
**Status:** Approved, ready for implementation plan

## Problem

The gym chat agent only has SELECT access to `gym_lifts` and `gym_day_meta`. The authoritative anatomy data (`exercises.body_part_key`, `exercise_aliases`, `body_parts`, `daytag_defaults`) lives in tables the agent cannot see or query. As a result:

- Muscle-classification queries (e.g. "what are my quad exercises by volume?") rely on the LLM's anatomy knowledge plus a brittle session-co-occurrence hack injected into the system prompt.
- The hack produces wrong answers when multiple muscles are trained in the same session (e.g. Leg Press classified as a hamstring exercise, RDLs classified as a quad exercise).
- Exercise name variations ("RDL" vs "RDLs", "Pull Up" vs "Pull Ups") cannot resolve because `exercise_aliases` is invisible.
- The system prompt is heavier than necessary because the agent compensates with prose rules instead of having structured data.

## Goal

Give the chat agent first-class access to the gym data model so it answers muscle-classification, alias resolution, and intent-vs-actual questions from authoritative tables instead of guesswork. No schema mutations, no data migration, no form changes.

## Non-goals

- Schema changes to `gym_lifts` (no `exercise_id` denormalization).
- Form workflow changes. The log-workout form already uses `exercises` and `exercise_aliases` for autocomplete and writes free-form `exercise` text to `gym_lifts`. That stays.
- Removing the `gym_day_meta.body_parts` session-intent column. It carries different information from muscles-derived-from-logged-exercises and remains useful.
- Migration tooling. The DB has no migration framework; we commit a one-shot SQL script.

## Current state

**Tables in `public` schema:**

| Table | Rows | Role |
|---|---|---|
| `gym_lifts` | 2168 | Every logged set. `exercise text` is free-form. Already exposed to agent. |
| `gym_day_meta` | 143 | Per-day metadata: `day_tag`, `body_parts text[]` (session intent). Already exposed. |
| `exercises` | 49 | Canonical: `id uuid, name text, body_part_key text→body_parts.key, is_active bool`. **Invisible to agent.** |
| `exercise_aliases` | 4 | `exercise_id uuid→exercises.id, alias text`. e.g. `"RDL" → RDLs exercise row`. **Invisible to agent.** |
| `body_parts` | 12 | `key text, label text`. The 12 valid muscle keys (biceps, chest, shoulders, back, triceps, quads, hamstrings, forearms, core, glutes, calves, hips). **Invisible to agent.** |
| `daytag_defaults` | 3 | `day_tag text, body_parts text[]`. push/pull/leg day muscle defaults. **Invisible to agent.** |

**Coverage:** 100% of 39 distinct `gym_lifts.exercise` text values match `exercises.name` OR `exercise_aliases.alias` case-insensitively. No unclassifiable historic data.

**Access:** The chat endpoint connects as Postgres role `gym_chat_ro`. Current grants: `SELECT` on `analytics, gym_day_meta, gym_lifts` only.

**Catalog discovery filter:** `lib/gym-chat/catalog.ts:22` uses `TABLE_NAME_PATTERN = /^gym_/i`, which excludes every non-`gym_` table even if the role had grants.

**Existing hacks the agent relies on today:**

- `getExerciseContext()` in `catalog.ts` queries `gym_lifts ⋈ gym_day_meta` and emits a list like `RDLs [quads/hamstrings]` based on session-day co-occurrence. The header was strengthened earlier this session to disclaim these tags as session metadata, but the model still leans on them.
- `semantics.ts` has a multi-paragraph "anatomy STRICTLY overrides" rule that hand-lists primary movers for each muscle. Heavy, brittle, and only partially effective.
- `getBodyPartsContext()` queries `SELECT DISTINCT UNNEST(body_parts) FROM gym_day_meta` to give the agent valid body_part filter values. Works but sources from session metadata, not the canonical `body_parts` table.

## Design

### Topology

```
gym_lifts (text exercise)        ──┐
                                   ├─► gym_lifts_v (view)   ◄── agent's primary lift source
exercises (canonical anatomy)      │     adds: exercise_id, canonical_name, body_part_key
exercise_aliases (text→id)         │
                                   │
body_parts        ◄── reference table: valid body_part_keys + labels
daytag_defaults   ◄── reference table: push/pull/leg → muscle defaults
gym_day_meta      ◄── unchanged: session-level INTENT (distinct from logged-muscles)
```

### Database changes

One committed SQL script: `db/migrations/2026-05-31-gym-data-unification.sql`.

```sql
-- 1. Pre-resolved view of gym_lifts with canonical anatomy
CREATE OR REPLACE VIEW gym_lifts_v AS
SELECT
  gl.*,
  COALESCE(e_direct.id, e_alias.id)              AS exercise_id,
  COALESCE(e_direct.name, e_alias.name)          AS canonical_name,
  COALESCE(e_direct.body_part_key, e_alias.body_part_key) AS body_part_key
FROM gym_lifts gl
LEFT JOIN exercises e_direct
  ON LOWER(TRIM(e_direct.name)) = LOWER(TRIM(gl.exercise))
LEFT JOIN exercise_aliases ea
  ON LOWER(TRIM(ea.alias)) = LOWER(TRIM(gl.exercise))
LEFT JOIN exercises e_alias
  ON e_alias.id = ea.exercise_id;

-- 2. Grant SELECT on reference tables + view to the agent's role
GRANT SELECT ON exercises, exercise_aliases, body_parts, daytag_defaults, gym_lifts_v
  TO gym_chat_ro;
```

The view is read-only and computed live. No data migration; no `ALTER TABLE`; no FK additions.

### Catalog layer (`lib/gym-chat/catalog.ts`)

Replace the prefix filter with an explicit allowlist:

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

Discovery query filters with `AND table_name = ANY($1::text[])` instead of `LIKE 'gym_%'`. `groupRowsIntoTables` filters against `GYM_TABLES.has(name)`.

`FALLBACK_TABLES` is extended with column definitions for the 5 new tables/view so the agent still works if `information_schema` is unreachable.

`TABLE_ANNOTATIONS` gains entries for each new table/view:

- **`gym_lifts_v`** — "Use this instead of `gym_lifts` for any query that filters or groups by muscle. Pre-resolves `canonical_name` and `body_part_key` via `exercises` + `exercise_aliases`. Rows where `canonical_name IS NULL` are unclassified historic data — treat as unknown body part."
- **`exercises`** — "Canonical exercise catalog. `body_part_key` is authoritative anatomy. Only `is_active = true` rows count for current programming."
- **`exercise_aliases`** — "Alias → canonical exercise. Use for fuzzy name lookups; `gym_lifts_v` already resolves these automatically."
- **`body_parts`** — "Reference: the 12 valid `body_part_key` values and their display labels."
- **`daytag_defaults`** — "Programmed muscle defaults per `day_tag` (push/pull/leg). Use to answer 'what was supposed to be on a push day?'"

**Deletions** (the co-occurrence hack and its plumbing):

- `fetchExercisesFromDatabase()`
- `loadExerciseCatalog()`
- `getExerciseContext()`
- `cachedExercises`, `exerciseCacheExpiresAt`, `exerciseLoadingPromise` state
- `ExerciseEntry` type export
- `EXERCISE_CACHE_TTL_MS` constant
- All imports of `loadExerciseCatalog` / `getExerciseContext` in `route.ts`

**`getBodyPartsContext()` re-source:** query `SELECT key, label FROM body_parts ORDER BY key` (with appropriate type) instead of `SELECT DISTINCT UNNEST(body_parts) FROM gym_day_meta`. Output format becomes `key (label)` per line, e.g. `quads (Quads), hamstrings (Hamstrings), ...`. Same purpose (prevent the agent inventing values like "legs"), better source.

### SQL patterns (`lib/gym-chat/semantics.ts`)

Rewrites:

- **`exercises for a body part / bicep exercises / chest exercises / exercises by muscle`** — replace the entire anatomy-override prose + hand-listed ILIKE OR pattern with a `gym_lifts_v` JOIN:
  ```sql
  WITH sets AS (
    SELECT canonical_name, body_part_key, weight, reps,
           COALESCE(date::date, timestamp::date) AS session_date
    FROM gym_lifts_v
  )
  SELECT canonical_name AS exercise, SUM(weight * reps) AS volume
  FROM sets
  WHERE session_date >= CURRENT_DATE - ($1)::interval
    AND body_part_key = $2  -- e.g. 'quads'
  GROUP BY canonical_name
  ORDER BY volume DESC
  ```
  Params: `['1 month', 'quads']`. Single-param body part instead of N exercise names.

- **`top sets by body part`** — same swap: use `gym_lifts_v.body_part_key` directly; drop the `gym_day_meta` join + `UNNEST`.

- **`weekly muscle group volume comparison`** — group by `gym_lifts_v.body_part_key` (actual logged muscles) instead of `gym_day_meta.body_parts` UNNEST (planned intent). The previous co-occurrence-based version becomes incorrect.

- **`body parts`** — narrowed in scope. Now used only for session-intent queries: "which sessions did I plan to train chest?" Filters on `gym_day_meta.body_parts`. Muscle-volume questions go through `gym_lifts_v`.

Additions:

- **`session intent vs logged`** — `JOIN` `gym_day_meta` planned `body_parts` against distinct `gym_lifts_v.body_part_key` per session_date. Surfaces gaps: "tagged push day, no shoulder work logged."

- **`exercises by day_tag default`** — pure query on `daytag_defaults` to answer "what's supposed to be on a leg day?"

### System prompt (`app/api/gym-chat/route.ts`)

`buildSystemPrompt()` changes:

- Remove the `## Exercise Reference` section entirely (replaced by structured catalog entries).
- Remove the `body_parts` SQL Rule line that warned against co-occurrence — no longer relevant.
- Replace the "Exercises by body part" SQL Rule with: "For muscle-aware queries (volume by muscle, exercises targeting a muscle, top sets per muscle), query `gym_lifts_v` and filter or group on `body_part_key`. Use raw `gym_lifts` only when anatomy is irrelevant."
- Keep `## Available Body Part Values` section (`getBodyPartsContext`), now sourced from `body_parts` table.

Imports updated to drop `loadExerciseCatalog` and `getExerciseContext`.

### Capabilities (`lib/gym-chat/capabilities.ts`)

Extend the data dictionary:

- Document `gym_lifts_v` as the primary muscle-aware view; reference its `canonical_name`, `exercise_id`, `body_part_key`.
- Document `exercises`, `exercise_aliases`, `body_parts`, `daytag_defaults` and their FK relationships.
- Remove the line referencing "anatomy knowledge + Exercise Reference catalog" as the muscle-classification source.

### SQL policy (`lib/gym-chat/sql-policy.ts`)

No code changes. The allowlist is built from the catalog tables in `buildAllowlist()`. Adding tables/columns to the catalog propagates to the policy automatically. JOIN syntax against the view is already permitted.

One thing to verify in implementation: `DATE_COLUMNS` and `VIRTUAL_COLUMNS` sets in `sql-policy.ts` need to recognize `canonical_name` and `body_part_key` as valid column references when they appear in WHERE clauses. The set is permissive (it does not block unknown column names; it whitelists certain virtual/date column behaviors), but worth checking.

### Form (`app/dashboards/gym/`)

No changes. Verified:

- `WorkoutForm.tsx:85` calls `getBootstrapData()` which loads exercises from the `exercises` table via `app/dashboards/gym/catalog.ts`.
- `ExerciseManagerModal.tsx` writes new exercises and aliases to `exercises` / `exercise_aliases`.
- The `INSERT INTO gym_lifts` path at `actions.ts:266` writes `exercise` as free text from a dropdown of canonical names.
- The view picks up new lifts on next query — no sync step.

## Verification

| Check | Method | Expected |
|---|---|---|
| Build clean | `npm run build` | exits 0, no type errors |
| Quad query correct | `curl /api/gym-chat "what are my quad exercises by volume in the last month?"` | only true quad exercises (Squat variants, Leg Press, Leg Extensions, Lunges); no RDLs, no Leg Curls, no Calf Raises |
| Hamstring query correct | `curl /api/gym-chat "show me my hamstring exercises by volume in the last month"` | only RDLs and Leg Curl variants; no Leg Press, no Hack Squat |
| Alias resolution | `curl /api/gym-chat "what did I do on RDL last week?"` | resolves "RDL" → "RDLs" via `exercise_aliases`, returns rows |
| New intent-vs-logged pattern | `curl /api/gym-chat "what muscles did I plan vs actually train this week?"` | compares `gym_day_meta.body_parts` to distinct `gym_lifts_v.body_part_key` per session |
| Form write path | Log a new set via the dashboard | row inserted into `gym_lifts`; immediately visible through `gym_lifts_v` |
| Permissions | Chat queries against `exercises`, `exercise_aliases`, `body_parts`, `daytag_defaults`, `gym_lifts_v` | succeed, no "permission denied" |

## Files touched

| File | Change |
|---|---|
| `db/migrations/2026-05-31-gym-data-unification.sql` | NEW — view definition + grants |
| `lib/gym-chat/catalog.ts` | Allowlist swap, fallback tables extended, annotations added, co-occurrence hack deleted, body-parts source switched |
| `lib/gym-chat/semantics.ts` | Rewrite 4 patterns, add 2 new ones, drop anatomy-override prose |
| `lib/gym-chat/capabilities.ts` | Extend data dictionary with new tables and join guidance |
| `app/api/gym-chat/route.ts` | System prompt updates; drop unused imports |
| `CLAUDE.md` | Replace existing gym-chat anatomy gotchas; the load-bearing Exercise Reference note becomes obsolete |

Not touched: `lib/gym-chat/sql-policy.ts`, `app/dashboards/gym/actions.ts`, `app/dashboards/gym/catalog.ts`, `WorkoutForm.tsx`, `ExerciseManagerModal.tsx`.

## Risks & mitigations

- **Catalog cache:** the agent caches the catalog for 5 minutes. After deploy, the first request may use stale data until cache expires or the process restarts. Mitigation: in dev, the dev server picks up file changes immediately; in production, a redeploy resets the process.
- **View consistency on rename:** if an `exercises.name` is renamed, historic `gym_lifts` rows logged under the old name lose their JOIN match unless an alias is added. Today this is a manual workflow via the ExerciseManagerModal; out of scope for this spec.
- **Unclassified rows:** rows where `canonical_name IS NULL` will appear in `gym_lifts_v` with NULL anatomy. The table annotation tells the agent to treat these as unknown body part. Current coverage is 100%, so this is a guard against future drift, not a current issue.
- **Existing prompt cache:** the OpenAI prompt cache will reset because the system prompt content changes (smaller, restructured). Expected one-time cost; not a regression.

## Open questions

None. All scope and behavior questions resolved during brainstorming.
