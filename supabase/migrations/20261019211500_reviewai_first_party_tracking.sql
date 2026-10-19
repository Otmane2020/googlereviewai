-- First-party traffic attribution for customer websites connected through Google Business.
CREATE TABLE IF NOT EXISTS public.reviewai_tracking_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  public_key text NOT NULL UNIQUE DEFAULT ('rv_' || replace(gen_random_uuid()::text,'-','')),
  domain text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.reviewai_tracking_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES public.reviewai_tracking_sites(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  event_type text NOT NULL CHECK(event_type IN ('page_view','conversion')),
  event_name text,
  page_path text NOT NULL,
  referrer_host text,
  source_type text NOT NULL,
  source_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviewai_events_site_time ON public.reviewai_tracking_events(site_id, created_at DESC);
ALTER TABLE public.reviewai_tracking_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviewai_tracking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner selects tracker" ON public.reviewai_tracking_sites FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Owner inserts tracker" ON public.reviewai_tracking_sites FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = (SELECT auth.uid())));
CREATE POLICY "Owner reads tracker events" ON public.reviewai_tracking_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reviewai_tracking_sites s WHERE s.id = site_id AND s.user_id = (SELECT auth.uid())));
GRANT SELECT, INSERT ON public.reviewai_tracking_sites TO authenticated;
GRANT SELECT ON public.reviewai_tracking_events TO authenticated;
REVOKE ALL ON public.reviewai_tracking_events FROM anon;
NOTIFY pgrst, 'reload schema';
