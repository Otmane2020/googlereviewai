-- Per-establishment DataForSEO measurements, never synthetic estimates.
CREATE TABLE IF NOT EXISTS public.seo_keyword_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  search_volume integer,
  cpc numeric(12,4),
  competition integer,
  location_name text NOT NULL,
  language_name text NOT NULL,
  source text NOT NULL DEFAULT 'dataforseo',
  measured_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seo_keyword_measurements_lookup_idx
  ON public.seo_keyword_measurements (user_id, business_id, measured_at DESC);
ALTER TABLE public.seo_keyword_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own SEO measurements"
 ON public.seo_keyword_measurements FOR SELECT TO authenticated
 USING ((SELECT auth.uid()) = user_id);
REVOKE ALL ON public.seo_keyword_measurements FROM anon;
GRANT SELECT ON public.seo_keyword_measurements TO authenticated;
NOTIFY pgrst, 'reload schema';
