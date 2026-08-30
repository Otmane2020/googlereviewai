-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  subscription_status TEXT DEFAULT 'trial',
  plan_id TEXT DEFAULT 'starter',
  billing_cycle TEXT DEFAULT 'monthly',
  trial_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id BIGSERIAL PRIMARY KEY,
  review_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  location_id TEXT NOT NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  review_date TIMESTAMPTZ NOT NULL,
  replied BOOLEAN DEFAULT FALSE,
  ai_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI settings table
CREATE TABLE public.ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT TRUE,
  tone TEXT DEFAULT 'friendly',
  response_length TEXT DEFAULT 'M',
  include_signature BOOLEAN DEFAULT TRUE,
  signature TEXT DEFAULT 'L''équipe {business_name}',
  custom_template TEXT DEFAULT '',
  auto_reply_delay INTEGER DEFAULT 5,
  only_positive_reviews BOOLEAN DEFAULT FALSE,
  minimum_rating INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  google_place_id TEXT,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating DECIMAL(2,1),
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Create RLS policies for reviews
CREATE POLICY "Users can view own reviews" ON public.reviews 
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own reviews" ON public.reviews 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON public.reviews 
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own reviews" ON public.reviews 
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create RLS policies for AI settings
CREATE POLICY "Users can manage own AI settings" ON public.ai_settings 
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Create RLS policies for businesses
CREATE POLICY "Users can view own businesses" ON public.businesses 
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own businesses" ON public.businesses 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own businesses" ON public.businesses 
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own businesses" ON public.businesses 
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_location_id ON public.reviews(location_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_businesses_user_id ON public.businesses(user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();