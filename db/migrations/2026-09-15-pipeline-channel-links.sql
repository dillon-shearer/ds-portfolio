-- P5-T414: extend pipeline_channel_stats with the public metadata the mobile link
-- hub renders (a self-hosted link-in-bio page). The tiktok-script publicStatsTick
-- upserts these alongside the existing counts; the direction is unchanged (the
-- pipeline pushes out, the site reads). All three are nullable so the existing rows
-- and any checkout without the new push keep working, and the page hides a channel
-- that has no links.
--
-- No new GRANT: the pipeline_writer role already holds table-level INSERT/UPDATE on
-- pipeline_channel_stats, which in Postgres covers columns added later.

ALTER TABLE pipeline_channel_stats ADD COLUMN IF NOT EXISTS display_name  text;
ALTER TABLE pipeline_channel_stats ADD COLUMN IF NOT EXISTS youtube_url   text;
ALTER TABLE pipeline_channel_stats ADD COLUMN IF NOT EXISTS instagram_url text;
