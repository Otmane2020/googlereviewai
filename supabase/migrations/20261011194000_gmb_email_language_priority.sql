-- Avoid silently forcing every connected Google Business Profile to French.
-- The email resolver uses the explicit per-location setting first, otherwise
-- the account's preferred language. New locations start without a language override.
BEGIN;
ALTER TABLE public.businesses ALTER COLUMN gmb_language DROP DEFAULT;
-- Previous default was 'fr' for ALL locations, including English accounts.
-- No UI existed to edit the column prior to this migration.
UPDATE public.businesses b
SET gmb_language = 'en'
FROM public.profiles p
WHERE b.user_id = p.id
  AND b.gmb_language = 'fr'
  AND left(lower(trim(coalesce(p.preferred_language,''))), 2) = 'en';
COMMIT;
