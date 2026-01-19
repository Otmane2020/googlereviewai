-- Add unique constraint to prevent duplicate reviews (same review_id per user)
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_unique_review_id_user 
UNIQUE (review_id, user_id);

-- Add unique constraint to prevent duplicate replies (only one ai_response per review)
-- This is already enforced by the table structure (ai_response is a single column per row)
-- But we can add an index for better performance on lookups
CREATE INDEX IF NOT EXISTS idx_reviews_user_pending 
ON public.reviews (user_id, ai_response) 
WHERE ai_response IS NULL;

-- Add a comment explaining the constraints
COMMENT ON CONSTRAINT reviews_unique_review_id_user ON public.reviews 
IS 'Prevents importing the same Google review twice for the same user';