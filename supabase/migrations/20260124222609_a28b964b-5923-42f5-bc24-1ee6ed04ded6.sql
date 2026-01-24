-- Create table for anonymous visitor tracking
CREATE TABLE public.visitor_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  page text NOT NULL,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_visitor_analytics_created_at ON public.visitor_analytics(created_at DESC);
CREATE INDEX idx_visitor_analytics_visitor_id ON public.visitor_analytics(visitor_id);
CREATE INDEX idx_visitor_analytics_utm_source ON public.visitor_analytics(utm_source);

-- Enable RLS
ALTER TABLE public.visitor_analytics ENABLE ROW LEVEL SECURITY;

-- Allow public insert (anonymous tracking)
CREATE POLICY "Anyone can insert analytics"
ON public.visitor_analytics
FOR INSERT
WITH CHECK (true);

-- Only admin can read (we'll check email in edge function)
CREATE POLICY "Service role can read analytics"
ON public.visitor_analytics
FOR SELECT
USING (false);  -- Block direct reads, use edge function instead