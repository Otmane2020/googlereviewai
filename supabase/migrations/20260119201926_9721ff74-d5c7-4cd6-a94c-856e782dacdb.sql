-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule cron-sync-reviews to run every 30 minutes
SELECT cron.schedule(
  'sync-reviews-every-30-min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hlruprayqfnatnldrski.supabase.co/functions/v1/cron-sync-reviews',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule auto-respond-reviews to run every 35 minutes (offset from sync)
SELECT cron.schedule(
  'auto-respond-every-35-min',
  '5,35 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hlruprayqfnatnldrski.supabase.co/functions/v1/auto-respond-reviews',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);