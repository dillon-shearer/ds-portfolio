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
