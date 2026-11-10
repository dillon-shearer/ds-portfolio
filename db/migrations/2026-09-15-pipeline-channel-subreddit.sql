-- P5-T414 follow-up: the link hub also shows which subreddit(s) each channel is
-- based on. tiktok-script's publicStatsTick upserts this alongside the other public
-- metadata. Nullable; no new GRANT (table-level INSERT/UPDATE covers new columns).

ALTER TABLE pipeline_channel_stats ADD COLUMN IF NOT EXISTS subreddit text;
