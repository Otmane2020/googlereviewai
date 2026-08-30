-- Add pushalert_subscriber_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pushalert_subscriber_id TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.pushalert_subscriber_id IS 'PushAlert subscriber ID for targeted push notifications';