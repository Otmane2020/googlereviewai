-- Add notified column to reviews to track notification status
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS notified boolean DEFAULT false;

-- Update existing reviews to mark them as already notified
UPDATE public.reviews SET notified = true WHERE notified IS NULL OR notified = false;

-- Add last_sync_at and last_sync_status to ai_settings for tracking
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS last_sync_at timestamp with time zone;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS last_sync_status text DEFAULT 'success';
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS last_sync_error text;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS reviews_synced_count integer DEFAULT 0;

-- Drop the old trigger function
DROP FUNCTION IF EXISTS public.notify_on_new_review() CASCADE;

-- Create improved trigger function that uses the notified flag
CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnVwcmF5cWZuYXRubGRyc2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODc1OTMsImV4cCI6MjA4MDk2MzU5M30.CnG5qU9hYhJ3gAd84sr4h1Q5ZAWuDQshy9e3nfg_8vA';
BEGIN
  -- Only notify if this is a new unnotified review
  -- Works for both INSERT (new review) and UPDATE (previously missed review)
  IF NEW.notified = false OR NEW.notified IS NULL THEN
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
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for INSERT only (BEFORE to allow modifying NEW.notified)
CREATE TRIGGER on_review_insert
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_review();