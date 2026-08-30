CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline_fr text,
  tagline_en text,
  price_eur numeric NOT NULL DEFAULT 0,
  price_usd numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  monthly_credits integer NOT NULL DEFAULT 0,
  agency_pool_credits integer NOT NULL DEFAULT 0,
  max_businesses integer NOT NULL DEFAULT 1,
  stripe_price_id_eur text,
  stripe_price_id_usd text,
  features_fr jsonb NOT NULL DEFAULT '[]'::jsonb,
  features_en jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_highlighted boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Service role can manage plans"
ON public.plans FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.plans (key, name, tagline_fr, tagline_en, price_eur, price_usd, monthly_credits, agency_pool_credits, max_businesses, stripe_price_id_eur, stripe_price_id_usd, features_fr, features_en, is_active, is_highlighted, sort_order)
VALUES
  ('starter', 'Starter', 'Suivez votre positionnement IA et répondez aux avis — gratuit à vie.', 'Track your AI ranking and reply to reviews — free forever.', 0, 0, 25, 0, 1, NULL, NULL,
   '["1 établissement","Rapports GEO hebdomadaires (3 mots-clés)","Réponses IA aux avis Google","25 crédits gratuits / mois"]'::jsonb,
   '["1 location","Weekly GEO reports (3 keywords)","AI replies to Google reviews","25 free credits / month"]'::jsonb,
   true, false, 1),
  ('daily', 'Quotidien', 'Gagnez la guerre du référencement IA en pilote automatique.', 'Win the AI search war on autopilot.', 9.99, 9.99, 200, 0, 3, 'price_1TSa8pEfti9t9nN9JHI4owg3', NULL,
   '["Jusqu''à 3 établissements","Suivi GEO quotidien (mots-clés illimités)","Posts SEO + Q&A AEO quotidiens sur Google","200 crédits IA / mois","Analyse de la concurrence","Support prioritaire"]'::jsonb,
   '["Up to 3 locations","Daily GEO tracking (unlimited keywords)","Daily SEO posts + AEO Q&A on Google","200 AI credits / month","Competitor analysis","Priority support"]'::jsonb,
   true, true, 2),
  ('agency', 'Agence', 'Pour les marques multi-établissements et agences (10+ établissements).', 'For multi-location brands and agencies (10+ locations).', 49, 49, 0, 1000, 999, 'price_1TTuIpEfti9t9nN9sy6pUNgU', NULL,
   '["Établissements illimités","Suivi de consommation par établissement","1000 crédits / mois (pool à allouer)","Rapports en marque blanche","Accès API","Account manager dédié"]'::jsonb,
   '["Unlimited locations","Per-location usage tracking","1000 credits / month (pool)","White-label reports","API access","Dedicated account manager"]'::jsonb,
   true, false, 3)
ON CONFLICT (key) DO UPDATE SET
  monthly_credits = EXCLUDED.monthly_credits,
  agency_pool_credits = EXCLUDED.agency_pool_credits,
  max_businesses = EXCLUDED.max_businesses,
  features_fr = EXCLUDED.features_fr,
  features_en = EXCLUDED.features_en,
  updated_at = now();