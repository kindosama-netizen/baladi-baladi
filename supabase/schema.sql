-- Baladi restaurant schema for Supabase (Postgres + RLS)
-- Run in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Categories
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name_ar text not null,
  description_ar text default '',
  image_url text default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Menu items
create table if not exists public.menu_items (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories(id) on delete cascade,
  name_ar text not null,
  description_ar text default '',
  price numeric(8,2) not null default 0,
  image_url text default '',
  is_popular boolean not null default false,
  is_recommended boolean not null default false,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_items_category_idx on public.menu_items(category_id);

-- Advertisements
create table if not exists public.advertisements (
  id bigint generated always as identity primary key,
  title_ar text not null,
  description_ar text default '',
  image_url text default '',
  promo_price numeric(8,2),
  discount_percent int,
  cta_text text default 'استكشف المنيو',
  cta_link text default '/menu',
  placement text not null default 'offers' check (placement in ('hero', 'banner', 'offers')),
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Site settings (singleton)
create table if not exists public.site_settings (
  id int primary key check (id = 1),
  restaurant_name text not null default 'بلدي - برجر وفطور',
  restaurant_name_en text default 'Baladi',
  tagline text default 'طعم بلدي .. بمذاق ما بتنساه',
  description text default 'أشهى أصناف البرجر والفطور، محضّرة بحب لتعيش تجربة طعم مميز',
  hero_headline text default 'طعم بلدي بمذاق ما بتنساه',
  hero_subtext text default 'برجر وفطور ومشاوي محضّرة بحب في قلب إربد — شارع البتراء',
  logo_url text default '',
  hero_image_url text default '',
  about_image_url text default '',
  phone text default '0775051801',
  address text default 'إربد / شارع البتراء, Irbid, Jordan',
  maps_embed_url text default 'https://www.google.com/maps?q=32.5234797,35.901023&hl=ar&z=18&output=embed',
  maps_link text default 'https://maps.app.goo.gl/KvMyLqQM7YbGLzeQ8',
  facebook_url text default 'https://www.facebook.com/profile.php?id=61596672111492',
  instagram_url text default 'https://www.instagram.com/baladibaldi_jo',
  working_hours jsonb default '{"السبت - الخميس":"10:00 ص – 12:00 ص","الجمعة":"2:00 م – 12:00 ص"}'::jsonb,
  public_site_url text default '',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_updated on public.categories;
create trigger categories_updated before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists menu_items_updated on public.menu_items;
create trigger menu_items_updated before update on public.menu_items
for each row execute function public.set_updated_at();

drop trigger if exists advertisements_updated on public.advertisements;
create trigger advertisements_updated before update on public.advertisements
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_updated on public.site_settings;
create trigger site_settings_updated before update on public.site_settings
for each row execute function public.set_updated_at();

-- RLS
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.advertisements enable row level security;
alter table public.site_settings enable row level security;

-- Public read
drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories
  for select using (true);

drop policy if exists "Public read menu items" on public.menu_items;
create policy "Public read menu items" on public.menu_items
  for select using (true);

drop policy if exists "Public read advertisements" on public.advertisements;
create policy "Public read advertisements" on public.advertisements
  for select using (true);

drop policy if exists "Public read settings" on public.site_settings;
create policy "Public read settings" on public.site_settings
  for select using (true);

-- Authenticated admin write
drop policy if exists "Admin write categories" on public.categories;
create policy "Admin write categories" on public.categories
  for all to authenticated using (true) with check (true);

drop policy if exists "Admin write menu items" on public.menu_items;
create policy "Admin write menu items" on public.menu_items
  for all to authenticated using (true) with check (true);

drop policy if exists "Admin write advertisements" on public.advertisements;
create policy "Admin write advertisements" on public.advertisements
  for all to authenticated using (true) with check (true);

drop policy if exists "Admin write settings" on public.site_settings;
create policy "Admin write settings" on public.site_settings
  for all to authenticated using (true) with check (true);

-- Storage bucket for media
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "Authenticated upload media" on storage.objects;
create policy "Authenticated upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');

drop policy if exists "Authenticated update media" on storage.objects;
create policy "Authenticated update media" on storage.objects
  for update to authenticated using (bucket_id = 'media');

drop policy if exists "Authenticated delete media" on storage.objects;
create policy "Authenticated delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media');
