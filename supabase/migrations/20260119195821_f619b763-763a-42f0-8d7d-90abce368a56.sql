-- Add google_reply column to store existing Google responses (manual/human replies)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS google_reply text;

-- Migrate existing data: move Google replies from ai_response to google_reply
-- Only for reviews that have replied=true but were NOT published via Starlinko
UPDATE public.reviews 
SET google_reply = ai_response, ai_response = NULL 
WHERE replied = true 
AND ai_response IS NOT NULL 
AND (published_to_google = false OR published_to_google IS NULL);

-- Add comment for clarity
COMMENT ON COLUMN public.reviews.google_reply IS 'Existing reply from Google (manual/human response, not AI-generated)';