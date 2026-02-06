
-- Table to track abandoned carts for email recovery flow
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  billing_cycle TEXT DEFAULT 'monthly',
  total_amount NUMERIC DEFAULT 0,
  
  -- Email tracking: 1h, 24h, 72h
  email_1_sent_at TIMESTAMP WITH TIME ZONE,
  email_2_sent_at TIMESTAMP WITH TIME ZONE,
  email_3_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Conversion tracking
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Coupon tracking
  coupon_code TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Users can view their own abandoned carts
CREATE POLICY "Users can view own abandoned carts"
ON public.abandoned_carts FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own abandoned carts
CREATE POLICY "Users can insert own abandoned carts"
ON public.abandoned_carts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own abandoned carts
CREATE POLICY "Users can update own abandoned carts"
ON public.abandoned_carts FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_abandoned_carts_updated_at
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
