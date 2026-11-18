-- Update 10: "Register interest" waiting list for the family card (Nov 2026)
-- Families leave a first name and email, say whether they'd use the card,
-- and which local places they'd love a discount at. Only admins can read it.
-- Safe to run more than once. Paste into Supabase > SQL Editor and click Run.

create table if not exists public.interest (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null check (char_length(first_name) between 1 and 40),
  email       text not null check (char_length(email) between 3 and 320 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  would_use   text not null check (would_use in ('yes','maybe')),
  places      text check (places is null or char_length(places) <= 500),
  area        text check (area is null or char_length(area) <= 60),
  consent     boolean not null check (consent),          -- ticked "email me when the card launches"
  source      text check (source is null or char_length(source) <= 40),   -- e.g. fb, from /join?src=fb
  created_at  timestamptz not null default now()
);
create unique index if not exists interest_email_unique on public.interest (lower(email));

alter table public.interest enable row level security;
drop policy if exists "Anyone can register interest" on public.interest;
create policy "Anyone can register interest" on public.interest for insert to anon, authenticated with check (consent);
drop policy if exists "Admins manage interest" on public.interest;
create policy "Admins manage interest" on public.interest for all using (public.is_admin()) with check (public.is_admin());
grant insert on public.interest to anon, authenticated;
grant select, update, delete on public.interest to authenticated;
