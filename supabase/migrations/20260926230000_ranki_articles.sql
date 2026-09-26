create table if not exists public.ranki_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content_html text not null,
  content_markdown text,
  cover_url text,
  keywords text[],
  content_type text,
  status text default 'published',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

notify pgrst, 'reload schema';

alter table public.ranki_articles enable row level security;

revoke insert, update, delete, truncate on table public.ranki_articles from anon, authenticated;
revoke all on table public.ranki_articles from anon, authenticated;
grant select on table public.ranki_articles to anon, authenticated;
grant all on table public.ranki_articles to service_role;

drop policy if exists "Public can read published Ranki articles" on public.ranki_articles;
create policy "Public can read published Ranki articles"
on public.ranki_articles
for select
to anon, authenticated
using (status = 'published');

notify pgrst, 'reload schema';
