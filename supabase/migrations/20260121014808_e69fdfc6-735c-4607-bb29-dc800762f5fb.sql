-- Add maps_url column to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS maps_url text;

-- Create gmb_posts table for storing Google My Business posts
CREATE TABLE IF NOT EXISTS public.gmb_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  google_post_id text UNIQUE,
  topic_type text NOT NULL DEFAULT 'STANDARD',
  summary text NOT NULL,
  cta_type text,
  cta_url text,
  media_url text,
  posted_at timestamp with time zone,
  synced_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'synced',
  scheduled_for timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gmb_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for gmb_posts
CREATE POLICY "Users can view their own GMB posts"
  ON public.gmb_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own GMB posts"
  ON public.gmb_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GMB posts"
  ON public.gmb_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own GMB posts"
  ON public.gmb_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_gmb_posts_updated_at
  BEFORE UPDATE ON public.gmb_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gmb_posts_business_id ON public.gmb_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_gmb_posts_user_id ON public.gmb_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_gmb_posts_status ON public.gmb_posts(status);