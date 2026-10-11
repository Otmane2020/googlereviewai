-- GoogleReviewAI: three complimentary AI review replies per FREE account,
-- once per account, without monthly renewal. Paid plans and purchased credits
-- are handled by their existing Stripe workflow.
BEGIN;

CREATE OR REPLACE FUNCTION public.give_welcome_credits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
BEGIN
  UPDATE public.profiles SET credits = 3 WHERE id = NEW.id AND credits = 0;
  INSERT INTO public.credits_history(user_id, amount, type, description)
  VALUES (NEW.id, 3, 'bonus', '3 crédits IA gratuits de bienvenue (offre unique)');
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.refill_monthly_credits()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
BEGIN
  -- Intentional no-op: free credits are a lifetime welcome grant, not monthly.
  -- Stripe subscription and purchased-credit refill logic remains unchanged.
  RETURN;
END;
$fn$;

-- Preserve paid accounts and accounts with non-free credit grants/purchases.
-- Existing free users only retain unused credits within their original
-- allowance of three. Never increase an existing balance.
WITH eligible AS (
  SELECT p.id,
    GREATEST(0, LEAST(p.credits, 3 - COALESCE((
      SELECT SUM(ABS(ch.amount))
      FROM public.credits_history ch
      WHERE ch.user_id = p.id AND ch.amount < 0 AND ch.type = 'usage'
    ), 0)))::integer AS new_balance
  FROM public.profiles p
  WHERE (p.plan_name IS NULL OR btrim(p.plan_name) = '' OR lower(btrim(p.plan_name)) = 'free')
    AND NOT EXISTS (
      SELECT 1 FROM public.credits_history h
      WHERE h.user_id = p.id
        AND h.type NOT IN ('bonus', 'usage', 'monthly_refill')
    )
)
UPDATE public.profiles p
SET credits = e.new_balance
FROM eligible e
WHERE p.id = e.id AND p.credits > e.new_balance;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_upgrade_email_claimed_at timestamptz;

-- Restricted, race-safe claim used to send only one upgrade email.
CREATE OR REPLACE FUNCTION public.claim_free_upgrade_email(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE claimed uuid;
BEGIN
  UPDATE public.profiles
  SET free_upgrade_email_claimed_at = now()
  WHERE id = p_user_id
    AND credits = 0
    AND (plan_name IS NULL OR btrim(plan_name) = '' OR lower(btrim(plan_name)) = 'free')
    AND free_upgrade_email_claimed_at IS NULL
  RETURNING id INTO claimed;
  RETURN claimed IS NOT NULL;
END;
$fn$;

-- Debit and persist one reply in one transaction, checking ownership first.
-- -1 means quota exhausted (without saving response or consuming a credit).
CREATE OR REPLACE FUNCTION public.consume_review_ai_credit(
  p_user_id uuid,
  p_review_id bigint,
  p_response text,
  p_description text DEFAULT 'Réponse IA aux avis Google'
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE new_balance integer;
BEGIN
  IF p_response IS NULL OR length(btrim(p_response)) = 0 THEN
    RAISE EXCEPTION 'Empty AI response';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.reviews WHERE id = p_review_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Review not found or not owned by user';
  END IF;
  UPDATE public.profiles
  SET credits = credits - 1
  WHERE id = p_user_id AND credits > 0
  RETURNING credits INTO new_balance;
  IF new_balance IS NULL THEN RETURN -1; END IF;

  UPDATE public.reviews
  SET ai_response = p_response,
      needs_new_response = false,
      published_to_google = false
  WHERE id = p_review_id AND user_id = p_user_id;

  INSERT INTO public.credits_history(user_id, amount, type, description)
  VALUES(p_user_id, -1, 'usage', coalesce(p_description, 'Réponse IA aux avis Google'));
  RETURN new_balance;
END;
$fn$;

REVOKE ALL ON FUNCTION public.claim_free_upgrade_email(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_review_ai_credit(uuid,bigint,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_free_upgrade_email(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_review_ai_credit(uuid,bigint,text,text) TO service_role;
COMMIT;
