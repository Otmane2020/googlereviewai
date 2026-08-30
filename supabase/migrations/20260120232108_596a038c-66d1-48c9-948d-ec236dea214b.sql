-- Enable the pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to notify on new review
CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS TRIGGER AS $$
DECLARE
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnVwcmF5cWZuYXRubGRyc2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODc1OTMsImV4cCI6MjA4MDk2MzU5M30.CnG5qU9hYhJ3gAd84sr4h1Q5ZAWuDQshy9e3nfg_8vA';
BEGIN
  -- Call the edge function to send notifications
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_review_insert ON public.reviews;

-- Create trigger that fires on INSERT
CREATE TRIGGER on_review_insert
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_review();