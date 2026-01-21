-- Add option to respond to edited reviews in ai_settings
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS respond_to_edited_reviews boolean DEFAULT true;

-- Add column to track review edits in reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS last_edited_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS edit_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS needs_new_response boolean DEFAULT false;

-- Add comment to explain the columns
COMMENT ON COLUMN public.ai_settings.respond_to_edited_reviews IS 'If true, regenerate AI response when a review is edited by the customer';
COMMENT ON COLUMN public.reviews.last_edited_at IS 'Timestamp of the last edit detected from Google';
COMMENT ON COLUMN public.reviews.edit_count IS 'Number of times this review has been edited';
COMMENT ON COLUMN public.reviews.needs_new_response IS 'Flag indicating the review was edited and needs a new AI response';