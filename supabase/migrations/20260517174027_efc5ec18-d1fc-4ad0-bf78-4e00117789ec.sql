
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS business_id UUID,
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS shipping_country TEXT,
  ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qr_data JSONB,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- Enforce 1 free printed QR per account
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_free_printed_qr
  ON public.orders(user_id)
  WHERE order_type = 'printed_qr_free';

-- Allow admins/users to update their own non-subscription orders (status change, etc.) — keep current restrictive policy intact.
-- Add UPDATE policy for service role to set tracking + pdf_url
DROP POLICY IF EXISTS "Service role can update orders" ON public.orders;
CREATE POLICY "Service role can update orders" ON public.orders
  FOR UPDATE USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
