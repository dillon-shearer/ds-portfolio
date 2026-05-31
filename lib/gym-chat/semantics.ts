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
      "SELECT gm.date, gm.day_tag, gm.body_parts AS planned_parts, COALESCE(l.logged_parts, ARRAY[]::text[]) AS logged_parts, (SELECT ARRAY_AGG(p) FROM unnest(gm.body_parts) p WHERE NOT EXISTS (SELECT 1 FROM unnest(COALESCE(l.logged_parts, ARRAY[]::text[])) AS lp WHERE lp = p)) AS planned_not_logged, (SELECT ARRAY_AGG(p) FROM unnest(COALESCE(l.logged_parts, ARRAY[]::text[])) p WHERE NOT EXISTS (SELECT 1 FROM unnest(gm.body_parts) AS pp WHERE pp = p)) AS logged_not_planned\n" +
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

export const SEMANTIC_HINTS = SEMANTIC_MAPPINGS
  .map(({ phrase, sql }) => `- ${phrase} => ${sql}`)
  .join('\n')
