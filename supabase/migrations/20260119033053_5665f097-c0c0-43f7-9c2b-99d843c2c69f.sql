-- Add credits and plan limits to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_businesses INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'starter';

-- Create credits_history table to track purchases and usage
CREATE TABLE public.credits_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credits_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credits_history
CREATE POLICY "Users can view their own credits history" 
ON public.credits_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits history" 
ON public.credits_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_credits_history_user_id ON public.credits_history(user_id);
CREATE INDEX idx_credits_history_created_at ON public.credits_history(created_at DESC);