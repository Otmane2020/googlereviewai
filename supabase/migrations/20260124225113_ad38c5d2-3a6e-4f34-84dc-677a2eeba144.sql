-- Create table for storing Maps Rank keywords history
CREATE TABLE public.maps_rank_keywords (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  last_avg_rank numeric NULL,
  scan_count integer NOT NULL DEFAULT 1,
  last_scanned_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint on user_id + business_id + keyword
ALTER TABLE public.maps_rank_keywords 
ADD CONSTRAINT maps_rank_keywords_unique UNIQUE (user_id, business_id, keyword);

-- Enable RLS
ALTER TABLE public.maps_rank_keywords ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own keywords"
ON public.maps_rank_keywords FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own keywords"
ON public.maps_rank_keywords FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keywords"
ON public.maps_rank_keywords FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords"
ON public.maps_rank_keywords FOR DELETE
USING (auth.uid() = user_id);