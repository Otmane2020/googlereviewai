-- Create keywords table for AEO/SEO modules
CREATE TABLE public.keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own keywords"
ON public.keywords
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own keywords"
ON public.keywords
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keywords"
ON public.keywords
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords"
ON public.keywords
FOR DELETE
USING (auth.uid() = user_id);

-- Create subscriptions table for module subscriptions
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('aeo_rank', 'seo_autopost')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'trial')),
  price_monthly DECIMAL(10,2) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 month'),
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_keywords_updated_at
BEFORE UPDATE ON public.keywords
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();