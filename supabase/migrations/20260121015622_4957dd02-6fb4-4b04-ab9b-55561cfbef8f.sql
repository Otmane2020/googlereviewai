-- Add profile_image_url column to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS profile_image_url text;