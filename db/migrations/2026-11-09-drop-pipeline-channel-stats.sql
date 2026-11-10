DROP TABLE IF EXISTS pipeline_channel_stats;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pipeline_writer') THEN
    REVOKE USAGE ON SCHEMA public FROM pipeline_writer;
    DROP ROLE pipeline_writer;
  END IF;
END
$$;
