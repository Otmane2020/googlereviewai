-- Transactional selection of EXISTING Google establishments in the user's account.
-- Replaces dependence on a Google API call merely to change managed locations.
-- New, undiscovered establishments must still be imported through OAuth sync.
CREATE OR REPLACE FUNCTION public.set_my_managed_google_locations(selected_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  p record;
  quota integer;
  selected_count integer;
  owned_count integer;
  changed_count integer;
  paid boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF selected_ids IS NULL OR array_length(selected_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Select at least one establishment' USING ERRCODE = '22023';
  END IF;
  SELECT COUNT(DISTINCT id) INTO selected_count
  FROM unnest(selected_ids) AS id;
  IF selected_count <> cardinality(selected_ids) THEN
    RAISE EXCEPTION 'Duplicated selection' USING ERRCODE = '22023';
  END IF;

  -- Lock this user's profile to serialize concurrent plan/selection updates.
  SELECT plan_name, subscription_status, current_period_end, trial_end
    INTO p FROM public.profiles WHERE id = uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile missing' USING ERRCODE = '42501';
  END IF;
  paid := lower(coalesce(p.subscription_status,'')) IN ('active','trial','trialing')
    AND (p.current_period_end IS NULL OR p.current_period_end > now())
    AND (lower(coalesce(p.subscription_status,'')) NOT IN ('trial','trialing') OR p.trial_end > now());
  quota := CASE
    WHEN paid AND lower(coalesce(p.plan_name,'')) ~ '(business|agence|agency)' THEN 999
    WHEN paid AND lower(coalesce(p.plan_name,'')) ~ '(pro|quotidien|daily|growth)' THEN 3
    ELSE 1 END;
  IF selected_count > quota THEN
    RAISE EXCEPTION 'Plan limit: % managed location(s)', quota USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(DISTINCT id) INTO owned_count
  FROM public.businesses
  WHERE user_id = uid
    AND id = ANY(selected_ids)
    AND google_place_id IS NOT NULL AND length(trim(google_place_id)) > 0;
  IF owned_count <> selected_count THEN
    RAISE EXCEPTION 'Unknown or non-Google establishment' USING ERRCODE = '42501';
  END IF;

  UPDATE public.businesses
     SET is_active = (id = ANY(selected_ids)), updated_at = now()
   WHERE user_id = uid AND google_place_id IS NOT NULL
     AND is_active IS DISTINCT FROM (id = ANY(selected_ids));
  GET DIAGNOSTICS changed_count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'active_count', selected_count,
    'max_businesses', quota, 'updated', changed_count);
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_managed_google_locations(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_my_managed_google_locations(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_my_managed_google_locations(uuid[]) TO authenticated;
