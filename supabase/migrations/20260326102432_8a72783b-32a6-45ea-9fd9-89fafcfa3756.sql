
-- Update welcome credits from 10 to 25
CREATE OR REPLACE FUNCTION public.give_welcome_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Give 25 welcome credits to new users
  UPDATE public.profiles 
  SET credits = 25 
  WHERE id = NEW.id AND credits = 0;
  
  -- Log the welcome credits
  INSERT INTO public.credits_history (user_id, amount, type, description)
  VALUES (NEW.id, 25, 'bonus', 'Crédits de bienvenue (25 gratuits)');
  
  RETURN NEW;
END;
$function$;

-- Create monthly credit refill function (called by cron)
CREATE OR REPLACE FUNCTION public.refill_monthly_credits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_record RECORD;
BEGIN
  -- Give 25 free credits to all users who have less than 25 credits
  -- and don't have a paid "daily" plan (paid users get unlimited or buy packs)
  FOR profile_record IN 
    SELECT id, credits, plan_name 
    FROM public.profiles 
    WHERE (plan_name IS NULL OR plan_name = '' OR plan_name = 'free')
  LOOP
    -- Reset to 25 credits
    UPDATE public.profiles 
    SET credits = 25, updated_at = NOW()
    WHERE id = profile_record.id;
    
    -- Log the refill
    INSERT INTO public.credits_history (user_id, amount, type, description)
    VALUES (profile_record.id, 25, 'monthly_refill', 'Recharge mensuelle gratuite (25 crédits)');
  END LOOP;
END;
$function$;
