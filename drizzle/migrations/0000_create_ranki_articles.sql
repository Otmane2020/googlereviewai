CREATE TABLE public.ranki_articles (
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
  published_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ranki_articles TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.ranki_articles FROM anon, authenticated;
GRANT ALL ON public.ranki_articles TO service_role;
ALTER TABLE public.ranki_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published ranki articles are public" ON public.ranki_articles FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE TRIGGER update_ranki_articles_updated_at BEFORE UPDATE ON public.ranki_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
NOTIFY pgrst, 'reload schema';