-- Add AI response model field to businesses table
-- This stores a learned style profile from previous responses to maintain brand consistency

ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS ai_response_model jsonb DEFAULT NULL;

-- Add a comment to explain the field
COMMENT ON COLUMN public.businesses.ai_response_model IS 'Stores the learned AI response style model based on previous client responses for brand consistency. Contains tone patterns, vocabulary preferences, signature style, etc.';