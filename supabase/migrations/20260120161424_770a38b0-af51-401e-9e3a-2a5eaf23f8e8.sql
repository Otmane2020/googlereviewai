-- Remove default values to force users through Stripe checkout
ALTER TABLE public.profiles 
  ALTER COLUMN plan_name DROP DEFAULT,
  ALTER COLUMN plan_id DROP DEFAULT,
  ALTER COLUMN subscription_status DROP DEFAULT,
  ALTER COLUMN trial_end DROP DEFAULT;