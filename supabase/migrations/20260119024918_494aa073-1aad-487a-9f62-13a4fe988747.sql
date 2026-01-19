-- Add auto_publish_to_google column to ai_settings
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS auto_publish_to_google BOOLEAN DEFAULT FALSE;

-- Add auto_sync_reviews column to ai_settings
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS auto_sync_reviews BOOLEAN DEFAULT TRUE;

-- Add sync_interval_minutes column to ai_settings (default 30 minutes)
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS sync_interval_minutes INTEGER DEFAULT 30;

-- Add google_reply_id to reviews table to track published replies
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS google_reply_id TEXT;

-- Add published_to_google column to reviews
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS published_to_google BOOLEAN DEFAULT FALSE;

-- Add published_at column to reviews
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;