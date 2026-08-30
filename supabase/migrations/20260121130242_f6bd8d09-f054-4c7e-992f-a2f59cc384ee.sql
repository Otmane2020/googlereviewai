-- Update the default AI settings function to enable auto-publish by default
CREATE OR REPLACE FUNCTION public.create_default_ai_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO ai_settings (user_id, enabled, auto_sync_reviews, auto_publish_to_google, minimum_rating, tone, response_length)
  VALUES (NEW.id, true, true, true, 3, 'friendly', 'M')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;