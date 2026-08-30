
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed admin role for known admin email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'benyahya.otmane@gmail.com'
ON CONFLICT DO NOTHING;

-- Admin policies on orders & order_items
CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders" ON public.orders
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all order_items" ON public.order_items
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Shop products
CREATE TABLE public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  description_en text,
  price_eur numeric(10,2) NOT NULL,
  compare_at_price numeric(10,2),
  image_url text,
  category text NOT NULL DEFAULT 'plaque',
  platform text,
  stripe_price_id text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.shop_products
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage products" ON public.shop_products
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_shop_products_updated_at
BEFORE UPDATE ON public.shop_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed products
INSERT INTO public.shop_products (slug, name, description, description_en, price_eur, compare_at_price, category, platform, sort_order) VALUES
('plaque-nfc-google-avis', 'Plaque NFC Google Avis',
 'Plaque NFC premium 12×12 cm pour collecter des avis Google. Tapez ou scannez — vos clients laissent un avis en 5 secondes.',
 'Premium 12×12 cm NFC plaque to collect Google reviews. Tap or scan — your customers leave a review in 5 seconds.',
 39.90, NULL, 'plaque', 'google', 1),
('plaque-nfc-instagram', 'Plaque NFC Instagram',
 'Plaque NFC élégante pour booster vos abonnés Instagram. Vos clients sont redirigés vers votre profil en un tap.',
 'Elegant NFC plaque to grow your Instagram followers. Customers land on your profile in one tap.',
 29.90, NULL, 'plaque', 'instagram', 2),
('plaque-nfc-tiktok', 'Plaque NFC TikTok',
 'Plaque NFC pour développer votre audience TikTok rapidement. Tap & follow instantané.',
 'NFC plaque to grow your TikTok audience fast. Instant tap & follow.',
 39.90, NULL, 'plaque', 'tiktok', 3),
('plaque-nfc-snapchat', 'Plaque NFC Snapchat',
 'Plaque NFC Snapchat — partage instantané de votre Snapcode à vos clients.',
 'Snapchat NFC plaque — instantly share your Snapcode with customers.',
 31.90, 39.90, 'plaque', 'snapchat', 4),
('carte-nfc-google', 'Carte NFC Google Avis',
 'Carte NFC format CB pour collecter des avis Google. Toujours dans votre poche.',
 'Credit-card sized NFC card to collect Google reviews. Always in your pocket.',
 19.90, NULL, 'carte', 'google', 5),
('carte-nfc-instagram', 'Carte NFC Instagram',
 'Carte NFC Instagram — partagez votre profil en un tap pendant vos événements.',
 'Instagram NFC card — share your profile with one tap at events.',
 19.90, NULL, 'carte', 'instagram', 6),
('carte-nfc-linkedin', 'Carte NFC LinkedIn',
 'Carte NFC LinkedIn — networking professionnel sans contact, idéal pour vos rendez-vous.',
 'LinkedIn NFC card — contactless professional networking, ideal for meetings.',
 19.90, NULL, 'carte', 'linkedin', 7),
('carte-nfc-paypal', 'Carte NFC PayPal',
 'Carte NFC PayPal — recevez vos paiements en un tap. Pratique et rapide.',
 'PayPal NFC card — receive payments in one tap. Fast and easy.',
 15.90, 19.90, 'carte', 'paypal', 8);
