-- Add unique constraint on review_id and user_id for batch upsert
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_review_id_user_id_unique 
UNIQUE (review_id, user_id);