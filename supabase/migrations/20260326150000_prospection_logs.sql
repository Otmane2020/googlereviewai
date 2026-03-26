-- Table pour logger toutes les actions de prospection
CREATE TABLE IF NOT EXISTS prospection_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'call', 'email')),
  to TEXT NOT NULL,
  business_name TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  twilio_sid TEXT,
  email_subject TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des prospects scrappés depuis Google Maps
CREATE TABLE IF NOT EXISTS prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  category TEXT, -- restaurant, salon, garage...
  google_rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  owner_responds BOOLEAN DEFAULT FALSE,
  contact_status TEXT DEFAULT 'new' CHECK (contact_status IN ('new', 'sms_sent', 'called', 'emailed', 'responded', 'converted', 'ignored')),
  notes TEXT,
  google_maps_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_prospects_city ON prospects(city);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(contact_status);
CREATE INDEX IF NOT EXISTS idx_prospects_category ON prospects(category);
CREATE INDEX IF NOT EXISTS idx_prospection_logs_business ON prospection_logs(business_name);

-- RLS
ALTER TABLE prospection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Politique service role uniquement (fonctions backend)
CREATE POLICY "Service role only" ON prospection_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON prospects
  FOR ALL USING (auth.role() = 'service_role');
