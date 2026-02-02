-- Add timezone column to ai_settings
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris';

-- Update existing records to have a default timezone
UPDATE public.ai_settings 
SET timezone = 'Europe/Paris' 
WHERE timezone IS NULL;