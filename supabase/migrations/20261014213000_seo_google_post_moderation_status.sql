-- Accepted Google Business Posts are often still PROCESSING/UNVERIFIED.
-- Keep queued articles out of "published" until Google confirms LIVE.
ALTER TABLE public.scheduled_content
  DROP CONSTRAINT IF EXISTS scheduled_content_status_check;

ALTER TABLE public.scheduled_content
  ADD CONSTRAINT scheduled_content_status_check
  CHECK (status IN ('pending','generating','generated','processing','published','rejected','failed'));
