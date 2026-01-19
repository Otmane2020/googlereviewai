-- Add columns for storing custom Google OAuth tokens
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ;