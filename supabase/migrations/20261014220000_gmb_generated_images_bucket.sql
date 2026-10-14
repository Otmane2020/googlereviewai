-- Public image URLs are required by Google's Local Posts media.sourceUrl.
-- Uploads are performed exclusively with the service-role Supabase client in
-- the authenticated edge function; no public write policy is installed.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gmb-generated-images', 'gmb-generated-images', true, 10485760, ARRAY['image/png','image/jpeg','image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
