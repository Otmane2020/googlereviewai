-- ReviewsAI one-time Stripe credit packs. Prevent duplicate balance grants from
-- checkout.session.completed / async_payment_succeeded webhook re-deliveries.
CREATE TABLE IF NOT EXISTS public.stripe_credit_purchases (
  stripe_session_id text PRIMARY KEY CHECK (stripe_session_id ~ '^cs_'),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits integer NOT NULL CHECK (credits > 0 AND credits <= 100000),
  price_keys text NOT NULL,
  currency text NOT NULL,
  amount_total bigint NOT NULL CHECK (amount_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stripe_credit_purchases_user_idx ON public.stripe_credit_purchases(user_id);
ALTER TABLE public.stripe_credit_purchases ENABLE ROW LEVEL SECURITY;
-- No client policies. Only the webhook's service-role RPC can record a purchase.

CREATE OR REPLACE FUNCTION public.grant_stripe_checkout_credits(
  p_session_id text,
  p_user_id uuid,
  p_credits integer,
  p_price_keys text,
  p_currency text,
  p_amount_total bigint
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer;
  v_updated integer;
BEGIN
  IF p_session_id !~ '^cs_' OR p_user_id IS NULL
     OR p_credits IS NULL OR p_credits < 1 OR p_credits > 100000
     OR p_price_keys IS NULL OR length(p_price_keys) > 500
     OR p_currency IS NULL OR p_currency NOT IN ('eur','usd')
     OR p_amount_total IS NULL OR p_amount_total <= 0 THEN
    RAISE EXCEPTION 'Invalid verified Stripe credit-pack purchase';
  END IF;

  INSERT INTO public.stripe_credit_purchases
    (stripe_session_id, user_id, credits, price_keys, currency, amount_total)
  VALUES (p_session_id, p_user_id, p_credits, p_price_keys, p_currency, p_amount_total)
  ON CONFLICT (stripe_session_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN false; -- Idempotent webhook retry: no second credit grant.
  END IF;

  UPDATE public.profiles SET credits = COALESCE(credits, 0) + p_credits WHERE id = p_user_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 1 THEN
    RAISE EXCEPTION 'Profile missing for verified credit purchase';
  END IF;

  INSERT INTO public.credits_history (user_id, amount, type, description)
  VALUES (p_user_id, p_credits, 'purchase', 'Stripe Checkout ' || p_session_id);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_stripe_checkout_credits(text,uuid,integer,text,text,bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_stripe_checkout_credits(text,uuid,integer,text,text,bigint) TO service_role;
