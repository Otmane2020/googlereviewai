-- Record the explicit decision to use the lifetime free allowance.
-- Old onboarding_completed values alone are not trusted: they may have
-- been set prematurely while opening a Stripe checkout.
-- NULL is deliberately the default for every pre-existing profile.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_plan_selected_at timestamptz;

COMMENT ON COLUMN public.profiles.free_plan_selected_at IS
  'User explicitly chose the free 3 lifetime credits in onboarding; does not grant additional credits.';
