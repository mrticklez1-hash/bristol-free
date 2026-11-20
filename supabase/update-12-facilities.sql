-- Update 12: facilities (yes / no / unknown) and "last checked" dates (Nov 2026)
-- Each listing can have up to 15 facilities. A row means it's confirmed:
-- value 'yes' shows the icon, 'no' shows a "No ..." chip where it matters.
-- No row = unknown, so nothing shows. Business answers are never overwritten by research.
-- Safe to run more than once. Paste into Supabase > SQL Editor and click Run.

alter table public.listings add column if not exists last_checked date;

create table if not exists public.listing_facilities (
  listing_id    uuid not null references public.listings(id) on delete cascade,
  facility      text not null check (facility in (
                  'pushchair','baby_changing','toilets','accessible_toilet','step_free',
                  'free_parking','paid_parking','cafe','high_chairs','indoor','outdoor',
                  'picnic','dog_friendly','feeding','quiet_send')),
  value         text not null check (value in ('yes','no')),
  source        text check (source is null or char_length(source) <= 300),   -- link or short note, e.g. venue website
  confirmed_by  text not null default 'research' check (confirmed_by in ('research','parent','business')),
  checked_on    date not null default current_date,
  primary key (listing_id, facility)
);
alter table public.listing_facilities enable row level security;
drop policy if exists "Anyone can read facilities of published listings" on public.listing_facilities;
create policy "Anyone can read facilities of published listings" on public.listing_facilities for select
  using (exists (select 1 from public.listings l where l.id = listing_id and l.status = 'published') or public.is_admin());
drop policy if exists "Admins manage facilities" on public.listing_facilities;
create policy "Admins manage facilities" on public.listing_facilities for all using (public.is_admin()) with check (public.is_admin());
grant select on public.listing_facilities to anon, authenticated;
grant insert, update, delete on public.listing_facilities to authenticated;
