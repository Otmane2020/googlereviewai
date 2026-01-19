-- Insert default ai_settings for existing user if not exists
INSERT INTO ai_settings (user_id, enabled, auto_sync_reviews, auto_publish_to_google, minimum_rating, tone, response_length)
SELECT p.id, true, true, false, 3, 'friendly', 'M'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM ai_settings a WHERE a.user_id = p.id
);

-- Create function to auto-create ai_settings when a profile is created
CREATE OR REPLACE FUNCTION public.create_default_ai_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_settings (user_id, enabled, auto_sync_reviews, auto_publish_to_google, minimum_rating, tone, response_length)
  VALUES (NEW.id, true, true, false, 3, 'friendly', 'M')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_profile_created_ai_settings ON profiles;
CREATE TRIGGER on_profile_created_ai_settings
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_ai_settings();

-- Add email_notifications column to ai_settings if not exists
ALTER TABLE ai_settings ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;