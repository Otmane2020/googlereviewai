-- Add unique constraint to prevent duplicate businesses
ALTER TABLE public.businesses 
ADD CONSTRAINT businesses_google_place_id_user_id_key 
UNIQUE (google_place_id, user_id);