-- =============================================================
-- Setup: ระบบแจ้งเตือนอัตโนมัติ (Auto Push Notifications)
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1) Ensure notification_log table exists with unique constraint for deduplication
CREATE TABLE IF NOT EXISTS notification_log (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  band_id      uuid NOT NULL,
  notification_type text NOT NULL,
  reference_key text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (band_id, notification_type, reference_key)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_notification_log_band_type
  ON notification_log (band_id, notification_type, reference_key);

-- Auto-cleanup: delete notification_log entries older than 30 days
CREATE INDEX IF NOT EXISTS idx_notification_log_created
  ON notification_log (created_at);

-- 2) Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3) Grant cron schema access
GRANT USAGE ON SCHEMA cron TO postgres;

-- 4) Create cron job that calls the Edge Function every 5 minutes
-- This uses pg_net (built into Supabase) to call the Edge Function via HTTP
SELECT cron.schedule(
  'send-auto-notifications',               -- job name
  '*/5 * * * *',                            -- every 5 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Note: If the above fails because app.settings are not configured,
-- use this alternative with hardcoded project URL:
--
-- SELECT cron.schedule(
--   'send-auto-notifications',
--   '*/5 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://wsorngsyowgxikiepice.supabase.co/functions/v1/send-notifications',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );

-- 5) Cleanup old notification logs (daily at 3 AM Thai time = 20:00 UTC)
SELECT cron.schedule(
  'cleanup-notification-log',
  '0 20 * * *',
  $$DELETE FROM notification_log WHERE created_at < now() - interval '30 days';$$
);

-- 6) Verify cron jobs are created
SELECT * FROM cron.job ORDER BY jobid;
