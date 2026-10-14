-- Align the active GoogleReviewAI catalogue with its current EUR checkout prices.
-- This changes plan configuration only, never users' existing subscriptions,
-- subscription history, credits or Stripe billing objects.
UPDATE public.plans SET
  price_eur = 9.99,
  monthly_credits = 50,
  max_businesses = 1,
  stripe_price_id_eur = 'price_1TjxSJEfti9t9nN9XgMVswCh',
  updated_at = NOW()
WHERE key = 'ranki_starter' AND is_active = TRUE;

UPDATE public.plans SET
  price_eur = 49.00,
  monthly_credits = 300,
  max_businesses = 3,
  stripe_price_id_eur = 'price_1TjxSKEfti9t9nN9HAzRfqz8',
  updated_at = NOW()
WHERE key = 'ranki_pro' AND is_active = TRUE;

UPDATE public.plans SET
  price_eur = 99.00,
  monthly_credits = 1000,
  max_businesses = 999,
  stripe_price_id_eur = 'price_1TjxSLEfti9t9nN9DqcufGNo',
  updated_at = NOW()
WHERE key = 'ranki_business' AND is_active = TRUE;
