-- Fix auto_publish_to_google default to TRUE (should match user expectation)
ALTER TABLE ai_settings ALTER COLUMN auto_publish_to_google SET DEFAULT true;

-- Update existing users who might have false due to old default
UPDATE ai_settings 
SET auto_publish_to_google = true 
WHERE auto_publish_to_google = false 
  AND created_at < NOW() - INTERVAL '1 day';

-- Ensure the trigger function uses correct defaults
CREATE OR REPLACE FUNCTION public.create_default_ai_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO ai_settings (
    user_id, 
    enabled, 
    auto_sync_reviews, 
    auto_publish_to_google, 
    minimum_rating, 
    tone, 
    response_length,
    email_notifications,
    respond_to_edited_reviews
  )
  VALUES (
    NEW.id, 
    true,  -- enabled
    true,  -- auto_sync_reviews
    true,  -- auto_publish_to_google (MUST BE TRUE)
    3,     -- minimum_rating
    'friendly', 
    'M',
    true,  -- email_notifications
    true   -- respond_to_edited_reviews
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;