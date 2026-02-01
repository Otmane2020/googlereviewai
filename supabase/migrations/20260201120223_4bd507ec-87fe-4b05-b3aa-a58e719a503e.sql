-- Create published_articles table for receiving external articles
CREATE TABLE public.published_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  body text NOT NULL,
  meta_description text,
  source_id text,
  author text DEFAULT 'Équipe Starlinko',
  published_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.published_articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "Anyone can view published articles"
ON public.published_articles
FOR SELECT
USING (true);

-- Only service role can insert/update/delete (via edge function)
CREATE POLICY "Service role can manage articles"
ON public.published_articles
FOR ALL
USING (false)
WITH CHECK (false);

-- Create index for slug lookups
CREATE INDEX idx_published_articles_slug ON public.published_articles(slug);

-- Create index for published_at ordering
CREATE INDEX idx_published_articles_published_at ON public.published_articles(published_at DESC);