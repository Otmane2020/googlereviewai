
CREATE TABLE public.print_ship_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'print_ship', -- 'pdf' | 'print_ship'
  prospect_place_id text,
  prospect_name text NOT NULL,
  prospect_address text,
  prospect_city text,
  prospect_country text,
  recipient jsonb,
  file_url text,
  gelato_order_id text,
  gelato_reference_id text,
  status text NOT NULL DEFAULT 'created',
  tracking_url text,
  tracking_code text,
  cost numeric(10,2),
  currency text DEFAULT 'EUR',
  last_status_check timestamptz,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.print_ship_orders TO authenticated;
GRANT ALL ON public.print_ship_orders TO service_role;

ALTER TABLE public.print_ship_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own print_ship_orders"
  ON public.print_ship_orders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_print_ship_orders_user_created ON public.print_ship_orders(user_id, created_at DESC);
CREATE INDEX idx_print_ship_orders_status ON public.print_ship_orders(status);

CREATE TRIGGER trg_print_ship_orders_updated
  BEFORE UPDATE ON public.print_ship_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for prospection-stickers bucket (private)
CREATE POLICY "users upload own prospection stickers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prospection-stickers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users read own prospection stickers"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'prospection-stickers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users delete own prospection stickers"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'prospection-stickers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users update own prospection stickers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'prospection-stickers' AND (storage.foldername(name))[1] = auth.uid()::text);
