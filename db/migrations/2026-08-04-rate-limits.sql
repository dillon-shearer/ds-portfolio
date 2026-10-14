-- Durable cross-instance rate-limit counters (2026-08-04)
-- Safe to re-run. Stale rows are opportunistically removed by lib/rate-limit.ts.

CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1
);
