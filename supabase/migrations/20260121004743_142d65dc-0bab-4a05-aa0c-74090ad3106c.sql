-- Create a function that calls the sync-google-reviews edge function when a business is inserted
CREATE OR REPLACE FUNCTION public.sync_reviews_on_business_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnVwcmF5cWZuYXRubGRyc2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODc1OTMsImV4cCI6MjA4MDk2MzU5M30.CnG5qU9hYhJ3gAd84sr4h1Q5ZAWuDQshy9e3nfg_8vA';
BEGIN
  -- Call the sync-google-reviews edge function asynchronously
  PERFORM net.http_post(
    url := 'https://hlruprayqfnatnldrski.supabase.co/functions/v1/sync-google-reviews',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id::text,
      'business_id', NEW.id::text,
      'triggered_by', 'business_insert_trigger'
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger on businesses table for INSERT
DROP TRIGGER IF EXISTS on_business_insert_sync_reviews ON public.businesses;

CREATE TRIGGER on_business_insert_sync_reviews
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_reviews_on_business_insert();