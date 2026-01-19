-- Create table for SEO articles (AutoPost)
CREATE TABLE public.seo_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  keywords TEXT[],
  source_url TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for AEO Q&A (ChatGPT Rank)
CREATE TABLE public.aeo_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  keywords TEXT[],
  priority INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aeo_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seo_articles
CREATE POLICY "Users can view their own articles" 
ON public.seo_articles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own articles" 
ON public.seo_articles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles" 
ON public.seo_articles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles" 
ON public.seo_articles FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for aeo_questions
CREATE POLICY "Users can view their own questions" 
ON public.aeo_questions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own questions" 
ON public.aeo_questions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questions" 
ON public.aeo_questions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions" 
ON public.aeo_questions FOR DELETE 
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_seo_articles_updated_at
BEFORE UPDATE ON public.seo_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aeo_questions_updated_at
BEFORE UPDATE ON public.aeo_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_seo_articles_user_id ON public.seo_articles(user_id);
CREATE INDEX idx_seo_articles_status ON public.seo_articles(status);
CREATE INDEX idx_aeo_questions_user_id ON public.aeo_questions(user_id);
CREATE INDEX idx_aeo_questions_category ON public.aeo_questions(category);