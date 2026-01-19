-- Create CRON job for engagement notifications (2x daily: 9 AM and 6 PM UTC)
SELECT cron.schedule(
  'engagement-notifications-morning',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://hlruprayqfnatnldrski.supabase.co/functions/v1/cron-engagement-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'engagement-notifications-evening',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://hlruprayqfnatnldrski.supabase.co/functions/v1/cron-engagement-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);