
-- Track welcome email so we can fire it from the client (which knows the navigator language)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Drop the auto-trigger that fired the welcome email from the DB (it cannot know browser language)
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_insert_send_welcome ON public.profiles;
DROP TRIGGER IF EXISTS send_welcome_email_on_signup_trigger ON public.profiles;
