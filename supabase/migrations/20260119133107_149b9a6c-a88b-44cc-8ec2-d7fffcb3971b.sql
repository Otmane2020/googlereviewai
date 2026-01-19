-- Add column to store Google refresh token for automatic token refresh
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.google_refresh_token IS 'Google OAuth refresh token for automatic token refresh when syncing reviews';