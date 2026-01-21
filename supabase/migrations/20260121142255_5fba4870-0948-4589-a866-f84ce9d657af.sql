-- Create trigger for welcome email on profile creation
CREATE OR REPLACE TRIGGER on_profile_created_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_on_signup();