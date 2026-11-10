-- P4-T71: per-channel YouTube subscriber and Instagram follower counts for the
-- /demos/reddit-pipeline cards. The tiktok-script publicStatsTick upserts them with
-- the existing counts; captured_at already timestamps the reading. Nullable because a
-- failed lookup, a hidden count, or an untargeted platform all write NULL, and the
-- card hides that row.
--
-- No new GRANT: pipeline_writer holds table-level INSERT/UPDATE on
-- pipeline_channel_stats, which covers columns added later.

ALTER TABLE pipeline_channel_stats ADD COLUMN IF NOT EXISTS youtube_subscribers integer;
ALTER TABLE pipeline_channel_stats ADD COLUMN IF NOT EXISTS instagram_followers integer;
