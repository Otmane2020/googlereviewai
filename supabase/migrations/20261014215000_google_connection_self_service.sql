-- Read the Google connection status without returning OAuth credentials.
-- Uses auth.uid() for every lookup; no arbitrary user ID is accepted.
CREATE OR REPLACE FUNCTION public.get_my_google_connection_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  p record;
  location_ids jsonb;
  selected_count integer;
  plan_limit integer;
  is_paid boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT google_refresh_token, plan_name, subscription_status,
    trial_end, current_period_end
    INTO p
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile unavailable';
  END IF;

  SELECT COUNT(*)::integer,
    COALESCE(jsonb_agg(google_place_id) FILTER (WHERE google_place_id IS NOT NULL), '[]'::jsonb)
    INTO selected_count, location_ids
  FROM public.businesses
  WHERE user_id = auth.uid() AND is_active IS TRUE;

  is_paid := lower(coalesce(p.subscription_status, '')) IN ('active','trial','trialing')
    AND (p.current_period_end IS NULL OR p.current_period_end > now())
    AND (lower(coalesce(p.subscription_status, '')) NOT IN ('trial','trialing') OR p.trial_end > now());

  plan_limit := CASE
    WHEN is_paid AND lower(coalesce(p.plan_name, '')) ~ '(business|agence|agency)' THEN 999
    WHEN is_paid AND lower(coalesce(p.plan_name, '')) ~ '(pro|quotidien|daily|growth)' THEN 3
    ELSE 1
  END;

  RETURN jsonb_build_object(
    'success', true,
    'connected', coalesce(length(nullif(p.google_refresh_token, '')), 0) > 0,
    'active_count', selected_count,
    'active_google_place_ids', location_ids,
    'max_businesses', plan_limit
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_google_connection_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_google_connection_status() TO authenticated;

-- Fallback for local disconnection if the Edge endpoint is not deployed.
-- It never deletes stored locations, reviews or subscription records.
CREATE OR REPLACE FUNCTION public.disconnect_my_google_connection()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET google_refresh_token = NULL,
      google_access_token = NULL,
      google_token_expires_at = NULL,
      updated_at = now()
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile unavailable';
  END IF;

  RETURN jsonb_build_object('success', true, 'connected', false, 'remote_revocation', false);
END;
$$;

REVOKE ALL ON FUNCTION public.disconnect_my_google_connection() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.disconnect_my_google_connection() TO authenticated;
