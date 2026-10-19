-- ReviewsAI AI visibility: opt-in, one weekly observation/location, capped by the worker to
-- two observations across all locations of one account in a rolling seven-day window.
-- Responses come from the actual Perplexity Sonar API. No simulated numbers.
CREATE TABLE IF NOT EXISTS public.reviewai_ai_visibility_settings (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviewai_ai_visibility_settings_enabled
  ON public.reviewai_ai_visibility_settings (enabled, updated_at) WHERE enabled;

CREATE TABLE IF NOT EXISTS public.reviewai_ai_visibility_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_week date NOT NULL,
  provider text NOT NULL DEFAULT 'perplexity_sonar' CHECK (provider = 'perplexity_sonar'),
  question text NOT NULL,
  answer text,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  mentioned boolean,
  cited boolean,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  error_code text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviewai_ai_visibility_once_per_week UNIQUE (business_id, run_week)
);
CREATE INDEX IF NOT EXISTS reviewai_ai_visibility_checks_account_date
  ON public.reviewai_ai_visibility_checks (user_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS reviewai_ai_visibility_checks_business_date
  ON public.reviewai_ai_visibility_checks (business_id, checked_at DESC);

ALTER TABLE public.reviewai_ai_visibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviewai_ai_visibility_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visibility settings owned" ON public.reviewai_ai_visibility_settings;
CREATE POLICY "visibility settings owned" ON public.reviewai_ai_visibility_settings
 FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "visibility settings insert owned" ON public.reviewai_ai_visibility_settings;
CREATE POLICY "visibility settings insert owned" ON public.reviewai_ai_visibility_settings
 FOR INSERT TO authenticated
 WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (
   SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = (SELECT auth.uid())
 ));
DROP POLICY IF EXISTS "visibility settings update owned" ON public.reviewai_ai_visibility_settings;
CREATE POLICY "visibility settings update owned" ON public.reviewai_ai_visibility_settings
 FOR UPDATE TO authenticated
 USING (user_id = (SELECT auth.uid()))
 WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (
   SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = (SELECT auth.uid())
 ));
DROP POLICY IF EXISTS "visibility checks select owned" ON public.reviewai_ai_visibility_checks;
CREATE POLICY "visibility checks select owned" ON public.reviewai_ai_visibility_checks
 FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.reviewai_ai_visibility_settings FROM anon;
REVOKE ALL ON public.reviewai_ai_visibility_checks FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.reviewai_ai_visibility_settings TO authenticated;
GRANT SELECT ON public.reviewai_ai_visibility_checks TO authenticated;

-- Weekly Monday morning scheduler. Uses an existing service-role key stored in
-- the Lovable Cloud Vault, not a plaintext secret embedded in a cron job.
-- The service-role token is verified server-side by ai-visibility-weekly.
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron')
     AND EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_net')
     AND EXISTS (SELECT 1 FROM vault.secrets WHERE name='email_queue_service_role_key')
  THEN
    PERFORM cron.schedule(
      'reviewsai-ai-visibility-weekly',
      '0 8 * * 1',
      $job$
      SELECT net.http_post(
        url := 'https://hlruprayqfnatnldrski.supabase.co/functions/v1/ai-visibility-weekly',
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='email_queue_service_role_key' LIMIT 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 150000
      );
      $job$
    );
  ELSE
    RAISE NOTICE 'Weekly AI visibility cron not scheduled: pg_cron/pg_net/vault credentials missing.';
  END IF;
END $do$;

NOTIFY pgrst, 'reload schema';
