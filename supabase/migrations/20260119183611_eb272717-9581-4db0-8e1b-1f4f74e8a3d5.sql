-- Fix the overly permissive RLS policy
DROP POLICY IF EXISTS "Service role can read all push subscriptions" ON public.push_subscriptions;