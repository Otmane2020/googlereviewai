-- Table for Web Push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own push subscriptions
CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own push subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Service role can read all subscriptions for sending notifications
CREATE POLICY "Service role can read all push subscriptions"
ON public.push_subscriptions FOR SELECT
USING (true);

-- Function to give new users welcome credits (update existing trigger)
CREATE OR REPLACE FUNCTION public.give_welcome_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Give 10 welcome credits to new users
  UPDATE public.profiles 
  SET credits = 10 
  WHERE id = NEW.id AND credits = 0;
  
  -- Log the welcome credits
  INSERT INTO public.credits_history (user_id, amount, type, description)
  VALUES (NEW.id, 10, 'bonus', 'Crédits de bienvenue');
  
  RETURN NEW;
END;
$$;

-- Trigger to give welcome credits after profile creation
DROP TRIGGER IF EXISTS on_profile_give_welcome_credits ON public.profiles;
CREATE TRIGGER on_profile_give_welcome_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.give_welcome_credits();