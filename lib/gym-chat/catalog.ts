import { createClient, createPool } from '@vercel/postgres'

export type GymCatalogColumn = {
  name: string
  dataType: string
}

export type GymCatalogTable = {
  name: string
  columns: GymCatalogColumn[]
}

export type CatalogAllowlist = {
  tables: Set<string>
  columns: Map<string, Set<string>>
  columnUnion: Set<string>
}

const NORMALIZE = (value: string) => value.trim().toLowerCase()
const TABLE_CACHE_TTL_MS = 5 * 60 * 1000
const ERROR_CACHE_TTL_MS = 60 * 1000
const GYM_TABLES = new Set([
  'gym_lifts',
  'gym_lifts_v',
  'gym_day_meta',
  'exercises',
  'exercise_aliases',
  'body_parts',
  'daytag_defaults',
])

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

let cachedTables: GymCatalogTable[] = FALLBACK_TABLES
let cachedContext = buildCatalogContext(FALLBACK_TABLES)
let cachedAllowlist = buildAllowlist(FALLBACK_TABLES)
let cacheExpiresAt = 0
let loadingPromise: Promise<GymCatalogTable[]> | null = null

function buildAllowlist(tables: GymCatalogTable[]): CatalogAllowlist {
  const tableSet = new Set<string>()
  const columnMap = new Map<string, Set<string>>()
  const columnUnion = new Set<string>()

  tables.forEach(table => {
    const normalized = NORMALIZE(table.name)
    tableSet.add(normalized)
    const columnSet = new Set<string>()
    table.columns.forEach(column => {
      const normalizedColumn = NORMALIZE(column.name)
      columnSet.add(normalizedColumn)
      columnUnion.add(normalizedColumn)
    })
    columnMap.set(normalized, columnSet)
  })

  return {
    tables: tableSet,
    columns: columnMap,
    columnUnion,
  }
}

function buildCatalogContext(tables: GymCatalogTable[]): string {
  if (!tables.length) {
    return 'Allowed tables: (none discovered)'
  }
  const lines: string[] = ['Tables (read-only, public schema):']
  tables.forEach(table => {
    const cols = table.columns.map(column => `${column.name} (${column.dataType})`).join(', ')
    const annotation = TABLE_ANNOTATIONS[table.name.toLowerCase()]
    if (annotation) {
      lines.push(`- ${table.name} — ${annotation.purpose}`)
      lines.push(`  Columns: ${cols}`)
      annotation.notes.forEach(note => lines.push(`  Note: ${note}`))
    } else {
      lines.push(`- ${table.name}: ${cols}`)
    }
  })
  return lines.join('\n')
}

const formatArrayType = (dataType: string, udtName: string) => {
  if (dataType === 'ARRAY') {
    return `${udtName.replace(/^_/, '')}[]`
  }
  return dataType
}

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

const resolveConnectionString = () =>
  process.env.GYM_CHAT_SCHEMA_URL ||
  process.env.GYM_CHAT_DATABASE_URL_READONLY ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  ''

const isPooledConnectionString = (connectionString: string) =>
  connectionString.includes('-pooler.') || connectionString.includes('pooler.')

const runCatalogQuery = async <T extends Record<string, unknown>>(
  connectionString: string,
  query: string,
): Promise<T[]> => {
  if (isPooledConnectionString(connectionString)) {
    const pool = createPool({ connectionString })
    const client = await pool.connect()
    try {
      const result = await client.query<T>(query)
      return result.rows ?? []
    } finally {
      client.release()
      await pool.end()
    }
  }

  const client = createClient({ connectionString })
  await client.connect()
  try {
    const result = await client.query<T>(query)
    return result.rows ?? []
  } finally {
    await client.end()
  }
}

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

const updateCache = (tables: GymCatalogTable[]) => {
  cachedTables = tables
  cachedContext = buildCatalogContext(tables)
  cachedAllowlist = buildAllowlist(tables)
}

export async function loadGymCatalog(options?: { force?: boolean }) {
  const now = Date.now()
  if (!options?.force && now < cacheExpiresAt) {
    return cachedTables
  }
  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = (async () => {
    try {
      const tables = await fetchCatalogFromDatabase()
      if (tables && tables.length) {
        updateCache(tables)
        cacheExpiresAt = Date.now() + TABLE_CACHE_TTL_MS
      } else {
        cacheExpiresAt = Date.now() + ERROR_CACHE_TTL_MS
      }
    } catch (error) {
      cacheExpiresAt = Date.now() + ERROR_CACHE_TTL_MS
      console.error('gym-chat catalog: failed to load schema.', error)
    }
    return cachedTables
  })()

  try {
    return await loadingPromise
  } finally {
    loadingPromise = null
  }
}

export const getCatalogContext = () => cachedContext
export const getCatalogTables = () => cachedTables
export const getCatalogAllowlist = (): CatalogAllowlist => cachedAllowlist
export const getFallbackCatalog = () => FALLBACK_TABLES

// Exercise pre-fetch — loads distinct exercises + body-part mapping from DB
// so the system prompt can include exact exercise names and muscle group data
// without requiring a SQL query round-trip at chat time.

type ExerciseRow = { exercise: string; body_parts: string[] | null }

export type ExerciseEntry = {
  name: string
  bodyParts: string[]
}

let cachedExercises: ExerciseEntry[] = []
let exerciseCacheExpiresAt = 0
let exerciseLoadingPromise: Promise<ExerciseEntry[]> | null = null
const EXERCISE_CACHE_TTL_MS = 10 * 60 * 1000

async function fetchExercisesFromDatabase(): Promise<ExerciseEntry[]> {
  const connectionString = resolveConnectionString()
  if (!connectionString) return []

  const rows = await runCatalogQuery<ExerciseRow>(
    connectionString,
    `
      WITH bp_counts AS (
        SELECT gl.exercise, bp, COUNT(*) AS cnt
        FROM gym_lifts gl
        LEFT JOIN gym_day_meta gm ON gm.date = COALESCE(gl.date::date, gl.timestamp::date)
        LEFT JOIN LATERAL UNNEST(gm.body_parts) AS bp ON true
        WHERE COALESCE(gl.date::date, gl.timestamp::date) >= CURRENT_DATE - INTERVAL '12 months'
          AND bp IS NOT NULL
        GROUP BY gl.exercise, bp
      ),
      with_max AS (
        SELECT exercise, bp, cnt,
               MAX(cnt) OVER (PARTITION BY exercise) AS max_cnt
        FROM bp_counts
      )
      SELECT exercise,
             array_agg(bp ORDER BY bp) FILTER (WHERE cnt = max_cnt) AS body_parts
      FROM with_max
      GROUP BY exercise
      ORDER BY exercise
    `,
  )
  return rows.map(row => ({
    name: row.exercise,
    bodyParts: row.body_parts ?? [],
  }))
}

export async function loadExerciseCatalog(options?: { force?: boolean }) {
  const now = Date.now()
  if (!options?.force && now < exerciseCacheExpiresAt && cachedExercises.length) {
    return cachedExercises
  }
  if (exerciseLoadingPromise) return exerciseLoadingPromise

  exerciseLoadingPromise = (async () => {
    try {
      const exercises = await fetchExercisesFromDatabase()
      if (exercises.length) {
        cachedExercises = exercises
        exerciseCacheExpiresAt = Date.now() + EXERCISE_CACHE_TTL_MS
      } else {
        exerciseCacheExpiresAt = Date.now() + ERROR_CACHE_TTL_MS
      }
    } catch (error) {
      exerciseCacheExpiresAt = Date.now() + ERROR_CACHE_TTL_MS
      console.error('gym-chat exercise catalog: failed to load.', error)
    }
    return cachedExercises
  })()

  try {
    return await exerciseLoadingPromise
  } finally {
    exerciseLoadingPromise = null
  }
}

export const getExerciseContext = (): string => {
  if (!cachedExercises.length) return ''
  const lines = cachedExercises.map(e =>
    e.bodyParts.length ? `${e.name} [${e.bodyParts.join('/')}]` : e.name,
  )
  return `Exercise name reference — use these EXACT spellings verbatim in SQL. The tags (e.g. [quads/hamstrings]) show which training DAYS each exercise was logged on (session metadata, NOT anatomy). Do NOT use these tags to decide which exercises belong to a muscle group — use only your anatomy knowledge for that (see "exercises for a body part" in SQL Patterns above).\n${lines.join('\n')}`
}

// Body-parts pre-fetch — loads distinct body_part values from gym_day_meta
// so the model knows the exact strings to use in WHERE clauses.

type BodyPartEntry = { key: string; label: string }
let cachedBodyParts: BodyPartEntry[] = []
let bodyPartsCacheExpiresAt = 0
let bodyPartsLoadingPromise: Promise<BodyPartEntry[]> | null = null

async function fetchBodyPartsFromDatabase(): Promise<BodyPartEntry[]> {
  const connectionString = resolveConnectionString()
  if (!connectionString) return []

  const rows = await runCatalogQuery<{ key: string; label: string }>(
    connectionString,
    `SELECT key, label FROM body_parts ORDER BY key`,
  )
  return rows.map(r => ({ key: r.key, label: r.label })).filter(e => e.key)
}

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
