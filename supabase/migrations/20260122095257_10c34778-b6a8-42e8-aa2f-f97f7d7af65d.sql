-- Fix the notify_on_new_review trigger to only notify for recent reviews without existing replies
CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnVwcmF5cWZuYXRubGRyc2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODc1OTMsImV4cCI6MjA4MDk2MzU5M30.CnG5qU9hYhJ3gAd84sr4h1Q5ZAWuDQshy9e3nfg_8vA';
BEGIN
  -- Only notify if ALL conditions are met:
  -- 1. The review hasn't been notified yet
  -- 2. The review is recent (less than 24 hours old) - prevents notifying old reviews during initial sync
  -- 3. The review doesn't already have a Google reply (already handled)
  -- 4. The review isn't marked as replied
  IF (NEW.notified = false OR NEW.notified IS NULL) 
     AND NEW.review_date > (NOW() - INTERVAL '24 hours')
     AND (NEW.google_reply IS NULL OR NEW.google_reply = '')
     AND NEW.replied = false THEN
    
    -- Mark as notified immediately to prevent duplicates
    NEW.notified := true;
    
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
  ELSE
    -- If conditions not met, mark as notified anyway to prevent future attempts
    NEW.notified := true;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Clean up existing data: mark all reviews with google_reply as notified
UPDATE reviews 
SET notified = true 
WHERE google_reply IS NOT NULL 
  AND (notified = false OR notified IS NULL);

-- Also mark old reviews (older than 24h) without notification as notified to prevent spam
UPDATE reviews 
SET notified = true 
WHERE review_date < (NOW() - INTERVAL '24 hours')
  AND (notified = false OR notified IS NULL);