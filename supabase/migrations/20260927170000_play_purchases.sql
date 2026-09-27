-- Google Play Billing purchases made from the Android app (TWA).
-- Links each Play purchase token to a user so renewals / cancellations
-- received through Real-time Developer Notifications can update the right
-- profile, and so a token can never be redeemed twice or by two accounts.
create table if not exists public.play_purchases (
  purchase_token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null,
  kind text not null check (kind in ('subscription', 'product')),
  state text,
  expiry_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists play_purchases_user_id_idx on public.play_purchases (user_id);

alter table public.play_purchases enable row level security;

revoke all on table public.play_purchases from anon, authenticated;
grant all on table public.play_purchases to service_role;

drop policy if exists "Users can read their own Play purchases" on public.play_purchases;
create policy "Users can read their own Play purchases"
on public.play_purchases
for select
to authenticated
using (auth.uid() = user_id);

grant select on table public.play_purchases to authenticated;

notify pgrst, 'reload schema';
