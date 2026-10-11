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
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS ranki_articles_slug_unique_idx
  ON public.ranki_articles (slug);

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
