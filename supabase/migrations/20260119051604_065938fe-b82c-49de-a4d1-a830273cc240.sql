-- Add description and auto-detected fields to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS categories TEXT[],
ADD COLUMN IF NOT EXISTS auto_keywords TEXT[];

-- Create scheduled_content table for the 30-day planning
CREATE TABLE public.scheduled_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('aeo_qa', 'seo_article')),
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'generated', 'published', 'failed')),
  title TEXT,
  content TEXT,
  question TEXT,
  answer TEXT,
  keyword_used TEXT,
  google_post_id TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id, content_type, scheduled_date)
);

-- Enable RLS
ALTER TABLE public.scheduled_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scheduled content"
ON public.scheduled_content
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled content"
ON public.scheduled_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled content"
ON public.scheduled_content
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled content"
ON public.scheduled_content
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_content_updated_at
BEFORE UPDATE ON public.scheduled_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();