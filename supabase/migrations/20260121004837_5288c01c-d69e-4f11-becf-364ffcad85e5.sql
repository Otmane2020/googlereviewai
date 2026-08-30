-- Drop the problematic constraint that prevents same review for different users
ALTER TABLE public.reviews DROP CONSTRAINT reviews_review_id_key;