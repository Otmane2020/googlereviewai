-- Add publication_hour column to ai_settings table for AEO/SEO auto-publish scheduling
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS publication_hour integer DEFAULT 7;

-- Add comment explaining the column
COMMENT ON COLUMN public.ai_settings.publication_hour IS 'Hour of day (0-23) for auto-publishing SEO/AEO content, defaults to 7 (07:00 UTC)';