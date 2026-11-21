-- Bristol Free & Affordable: Phase 1 database
-- Paste this whole file into Supabase > SQL Editor > New query, then click Run.
-- Safe to run more than once.

create extension if not exists "pgcrypto";

-- ---------- Listings ----------
create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text not null check (category in ('play','daysout','entertainment','outdoors','sport','classes','toddler','holiday','community','tutoring','cafes','shops','baby','hair','health','childcare','support','parties','entertainers','partyextras','photographers')), -- see update-15
  area          text not null,
  description   text,
  address       text,
  postcode      text,
  lat           double precision,
  lng           double precision,
  website       text,
  phone         text,
  opening_hours text,
  price_band    smallint not null default 0 check (price_band between 0 and 3), -- 0 free, 1 under £5, 2 £5-£10, 3 £10+
  ages          text[] not null default '{}',                                    -- baby, toddler, kids, teen
  image_url     text,
  status        text not null default 'published' check (status in ('draft','published')),
  claimed       boolean not null default false,
  featured      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists listings_area_idx on public.listings (area);
create index if not exists listings_category_idx on public.listings (category);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists listings_touch on public.listings;
create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();

-- ---------- Admins ----------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- Claim / "list my business" requests ----------
create table if not exists public.claim_requests (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references public.listings(id) on delete set null,
  business_name text not null check (char_length(business_name) <= 200),
  contact_name  text not null check (char_length(contact_name) <= 200),
  email         text not null check (char_length(email) <= 320),
  phone         text check (char_length(phone) <= 50),
  message       text check (char_length(message) <= 2000),
  status        text not null default 'new' check (status in ('new','done')),
  created_at    timestamptz not null default now()
);

-- ---------- Row level security ----------
alter table public.listings       enable row level security;
alter table public.admins         enable row level security;
alter table public.claim_requests enable row level security;

drop policy if exists "Public can read published listings" on public.listings;
create policy "Public can read published listings" on public.listings
  for select using (status = 'published' or public.is_admin());

drop policy if exists "Admins manage listings" on public.listings;
create policy "Admins manage listings" on public.listings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users can see their own admin row" on public.admins;
create policy "Users can see their own admin row" on public.admins
  for select using (user_id = auth.uid());

drop policy if exists "Anyone can send a claim request" on public.claim_requests;
create policy "Anyone can send a claim request" on public.claim_requests
  for insert with check (status = 'new');

drop policy if exists "Admins read claim requests" on public.claim_requests;
create policy "Admins read claim requests" on public.claim_requests
  for select using (public.is_admin());

drop policy if exists "Admins update claim requests" on public.claim_requests;
create policy "Admins update claim requests" on public.claim_requests
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins delete claim requests" on public.claim_requests;
create policy "Admins delete claim requests" on public.claim_requests
  for delete using (public.is_admin());

-- ---------- Image storage ----------
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view listing images" on storage.objects;
create policy "Public can view listing images" on storage.objects
  for select using (bucket_id = 'listing-images');

drop policy if exists "Admins upload listing images" on storage.objects;
create policy "Admins upload listing images" on storage.objects
  for insert with check (bucket_id = 'listing-images' and public.is_admin());

drop policy if exists "Admins change listing images" on storage.objects;
create policy "Admins change listing images" on storage.objects
  for update using (bucket_id = 'listing-images' and public.is_admin());

drop policy if exists "Admins delete listing images" on storage.objects;
create policy "Admins delete listing images" on storage.objects
  for delete using (bucket_id = 'listing-images' and public.is_admin());
