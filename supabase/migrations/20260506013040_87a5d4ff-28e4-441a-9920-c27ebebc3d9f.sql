
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 0;

ALTER TABLE public.credits_history
  ADD COLUMN IF NOT EXISTS business_id uuid;

CREATE INDEX IF NOT EXISTS idx_credits_history_business
  ON public.credits_history(business_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agency_total_credits integer NOT NULL DEFAULT 0;

-- Atomic consume: deducts 1 credit from a business and logs it.
CREATE OR REPLACE FUNCTION public.consume_business_credit(
  _business_id uuid,
  _description text DEFAULT 'Consommation IA'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _current integer;
BEGIN
  SELECT user_id, credits INTO _user_id, _current
  FROM public.businesses
  WHERE id = _business_id
  FOR UPDATE;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  IF _current < 1 THEN
    RETURN false;
  END IF;

  UPDATE public.businesses
  SET credits = credits - 1, updated_at = NOW()
  WHERE id = _business_id;

  INSERT INTO public.credits_history (user_id, business_id, amount, type, description)
  VALUES (_user_id, _business_id, -1, 'consumption', _description);

  RETURN true;
END;
$$;

-- Allocate credits from user's agency pool to a specific business.
CREATE OR REPLACE FUNCTION public.allocate_business_credits(
  _business_id uuid,
  _amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _pool integer;
BEGIN
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT user_id INTO _user_id
  FROM public.businesses
  WHERE id = _business_id;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT agency_total_credits INTO _pool
  FROM public.profiles
  WHERE id = _user_id
  FOR UPDATE;

  IF COALESCE(_pool, 0) < _amount THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET agency_total_credits = agency_total_credits - _amount, updated_at = NOW()
  WHERE id = _user_id;

  UPDATE public.businesses
  SET credits = credits + _amount, updated_at = NOW()
  WHERE id = _business_id;

  INSERT INTO public.credits_history (user_id, business_id, amount, type, description)
  VALUES (_user_id, _business_id, _amount, 'allocation', 'Allocation depuis pool Agence');

  RETURN true;
END;
$$;
