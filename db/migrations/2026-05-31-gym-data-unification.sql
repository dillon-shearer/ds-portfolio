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
