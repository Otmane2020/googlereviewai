-- Orders table for PaymentIntent flow
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  stripe_session_id TEXT UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_key TEXT,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own order items" ON public.order_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  ));

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();