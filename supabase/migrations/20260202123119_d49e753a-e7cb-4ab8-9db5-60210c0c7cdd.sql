-- Add preferred_language column to profiles for notification language
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'fr';

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.preferred_language IS 'Preferred language for notifications and AI content. Defaults to GMB language or browser locale.';

-- Add language column to businesses to track GMB language
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS gmb_language TEXT DEFAULT 'fr';

COMMENT ON COLUMN public.businesses.gmb_language IS 'Language detected from Google My Business profile';