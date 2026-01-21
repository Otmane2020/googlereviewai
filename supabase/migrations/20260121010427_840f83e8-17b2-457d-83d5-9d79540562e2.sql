-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_review_insert ON public.reviews;

-- Create improved function that only notifies for recent reviews (< 24h old)
CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnVwcmF5cWZuYXRubGRyc2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODc1OTMsImV4cCI6MjA4MDk2MzU5M30.CnG5qU9hYhJ3gAd84sr4h1Q5ZAWuDQshy9e3nfg_8vA';
  review_age INTERVAL;
BEGIN
  -- Calculate the age of the review
  review_age := NOW() - NEW.review_date;
  
  -- Only send notifications for reviews less than 24 hours old
  -- This prevents spam during initial GMB sync
  IF review_age < INTERVAL '24 hours' THEN
    PERFORM net.http_post(
      url := 'https://hlruprayqfnatnldrski.supabase.co/functions/v1/notify-new-review',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object(
        'review_id', NEW.id::text,
        'user_id', NEW.user_id::text,
        'author', COALESCE(NEW.author, 'Anonyme'),
        'rating', COALESCE(NEW.rating, 0),
        'comment', NEW.comment
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_review_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_review();