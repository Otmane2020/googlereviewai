-- Per-business diagnostics: a successful cron invocation is not evidence
-- that every managed Google listing returned its public reviews.
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS last_reviews_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_reviews_sync_status text,
  ADD COLUMN IF NOT EXISTS last_reviews_sync_error text,
  ADD COLUMN IF NOT EXISTS last_google_reviews_total integer;

COMMENT ON COLUMN public.businesses.last_reviews_sync_status IS
  'reviews_imported / google_empty / api_error / missing_from_google / syncing';
COMMENT ON COLUMN public.businesses.last_google_reviews_total IS
  'Google Business Profile Reviews API count; null means the API did not return a reliable total.';
