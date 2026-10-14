-- Ranki.ai article ingestion: public reading, service-role-only writes.
-- This migration targets the Supabase project configured in supabase/config.toml.
CREATE TABLE IF NOT EXISTS public.ranki_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content_html text,
  content_markdown text,
  cover_url text,
  keywords text[],
  content_type text,
  status text NOT NULL DEFAULT 'published',
  published_at timestamptz,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  google_publish_status text NOT NULL DEFAULT 'not_requested'
    CHECK (google_publish_status IN ('not_requested', 'publishing', 'published', 'failed')),
  google_post_id text,
  google_publish_error text,
  google_published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bring existing installations into alignment without dropping article data.
ALTER TABLE public.ranki_articles
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS content_html text,
  ADD COLUMN IF NOT EXISTS content_markdown text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS keywords text[],
  ADD COLUMN IF NOT EXISTS content_type text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS google_publish_status text DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS google_post_id text,
  ADD COLUMN IF NOT EXISTS google_publish_error text,
  ADD COLUMN IF NOT EXISTS google_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.ranki_articles
SET google_publish_status = 'not_requested'
WHERE google_publish_status IS NULL;

ALTER TABLE public.ranki_articles
  ALTER COLUMN google_publish_status SET DEFAULT 'not_requested',
  ALTER COLUMN google_publish_status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ranki_articles_google_publish_status_check'
      AND conrelid = 'public.ranki_articles'::regclass
  ) THEN
    ALTER TABLE public.ranki_articles
      ADD CONSTRAINT ranki_articles_google_publish_status_check
      CHECK (google_publish_status IN ('not_requested', 'publishing', 'published', 'failed'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS ranki_articles_slug_unique_idx
  ON public.ranki_articles (slug);

CREATE INDEX IF NOT EXISTS ranki_articles_business_id_idx
  ON public.ranki_articles (business_id);

CREATE UNIQUE INDEX IF NOT EXISTS ranki_articles_google_post_id_unique_idx
  ON public.ranki_articles (google_post_id)
  WHERE google_post_id IS NOT NULL;

ALTER TABLE public.ranki_articles ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.ranki_articles FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.ranki_articles FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.ranki_articles TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.ranki_articles TO service_role;

DROP POLICY IF EXISTS ranki_articles_published_select ON public.ranki_articles;
CREATE POLICY ranki_articles_published_select
  ON public.ranki_articles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Force PostgREST to refresh its schema after the DDL and grants.
NOTIFY pgrst, 'reload schema';
