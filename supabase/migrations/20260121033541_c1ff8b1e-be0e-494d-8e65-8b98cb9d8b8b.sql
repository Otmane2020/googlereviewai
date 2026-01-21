-- Add columns for review photos and criteria/aspects from GMB API
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS criteria jsonb DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN public.reviews.photos IS 'Array of photo URLs attached to the review by the customer';
COMMENT ON COLUMN public.reviews.criteria IS 'Rating criteria/aspects from GMB (e.g., hotel: cleanliness, service, rooms)';