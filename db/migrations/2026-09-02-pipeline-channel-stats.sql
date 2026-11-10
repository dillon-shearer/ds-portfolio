-- Per-channel Reddit pipeline stats shown on /demos/reddit-pipeline (2026-09-02)
-- Decision and rationale: docs/reddit-pipeline-overview.md section 6.
-- Safe to re-run.
--
-- Three rows, one per pipeline channel, upserted every six hours by the
-- publicStatsTick in tiktok-script (src/services/dashboard/server.ts). Nothing on
-- Vercel reads pipeline.db or the tailnet dashboard; the pipeline pushes here.
--
-- latest_posted_at is a timestamptz, not a date, on purpose: the pipeline posts
-- twice a day, so a date collapses both of a day's posts into one reading.

CREATE TABLE IF NOT EXISTS pipeline_channel_stats (
  channel_name text PRIMARY KEY,
  posted integer NOT NULL,
  posted_last_30_days integer NOT NULL,
  latest_posted_at timestamptz,
  captured_at timestamptz NOT NULL DEFAULT now()
);

-- The writing role. Created out of band because its password must not be in
-- version control; run this once against DATABASE_URL_UNPOOLED with a generated
-- secret, then put the resulting connection string in tiktok-script's .env as
-- PIPELINE_STATS_DATABASE_URL:
--
--   CREATE ROLE pipeline_writer WITH LOGIN PASSWORD '<generated>';
--
-- The grants below are idempotent and belong with the table, so they stay here.
-- The role gets this one table and nothing else: no gym tables, no sequences,
-- no schema rights.

GRANT USAGE ON SCHEMA public TO pipeline_writer;
GRANT SELECT, INSERT, UPDATE ON pipeline_channel_stats TO pipeline_writer;
