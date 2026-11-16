-- Update 05: What's on, Deals, Recipes and the free family card (Nov 2026)
-- Paste into Supabase > SQL Editor and click Run. Safe to run more than once.

create extension if not exists "pgcrypto";

-- ---------- What's on ----------
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) <= 200),
  description   text check (char_length(description) <= 2000),
  listing_id    uuid references public.listings(id) on delete set null,
  venue         text check (char_length(venue) <= 200),
  area          text not null,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  repeat_until  date,                 -- set for weekly events: repeats every week until this date
  price_band    smallint not null default 0 check (price_band between 0 and 3),
  price_note    text check (char_length(price_note) <= 120),
  ages          text[] not null default '{}',
  website       text,
  image_url     text,
  status        text not null default 'published' check (status in ('draft','published')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists events_starts_idx on public.events (starts_at);

-- ---------- Deals ----------
create table if not exists public.deals (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references public.listings(id) on delete set null,
  business_name text not null check (char_length(business_name) <= 200),
  area          text not null,
  badge         text not null check (char_length(badge) <= 8),     -- the big bit: 10%, FREE, £20
  offer         text not null check (char_length(offer) <= 120),   -- 10% off weekday entry
  details       text check (char_length(details) <= 1000),
  members_only  boolean not null default true,                     -- show your family card to redeem
  valid_until   date,
  website       text,
  status        text not null default 'published' check (status in ('draft','published')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- Recipes ----------
create table if not exists public.recipes (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique,
  title            text not null check (char_length(title) <= 200),
  summary          text check (char_length(summary) <= 600),
  image_url        text,
  photo_credit     text,
  serves           smallint,
  prep_mins        smallint,
  cook_mins        smallint,
  cost_per_serving numeric(6,2),
  ingredients      text[] not null default '{}',
  method           text[] not null default '{}',
  tags             text[] not null default '{}',
  status           text not null default 'published' check (status in ('draft','published')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create or replace function public.recipes_set_slug() returns trigger language plpgsql as $$
declare base text; s text; n int := 1;
begin
  if new.slug is null or new.slug = '' then
    base := trim(both '-' from regexp_replace(lower(coalesce(new.title, '')), '[^a-z0-9]+', '-', 'g'));
    if base = '' then base := 'recipe'; end if;
    s := base;
    while exists (select 1 from public.recipes where slug = s and id <> new.id) loop
      n := n + 1; s := base || '-' || n;
    end loop;
    new.slug := s;
  end if;
  return new;
end $$;
drop trigger if exists recipes_slug on public.recipes;
create trigger recipes_slug before insert or update on public.recipes
  for each row execute function public.recipes_set_slug();

drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events for each row execute function public.touch_updated_at();
drop trigger if exists deals_touch on public.deals;
create trigger deals_touch before update on public.deals for each row execute function public.touch_updated_at();
drop trigger if exists recipes_touch on public.recipes;
create trigger recipes_touch before update on public.recipes for each row execute function public.touch_updated_at();

-- ---------- Suggestions from the public (events and deals) ----------
-- Kept apart from the live tables so nothing goes on the site until you add it in admin.
create table if not exists public.suggestions (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('event','deal')),
  data          jsonb not null check (pg_column_size(data) < 8000),
  contact_name  text not null check (char_length(contact_name) <= 200),
  email         text not null check (char_length(email) <= 320),
  status        text not null default 'new' check (status in ('new','done')),
  created_at    timestamptz not null default now()
);

-- ---------- Family card members ----------
create table if not exists public.members (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  first_name  text not null check (char_length(first_name) between 1 and 40),
  card_code   text not null unique default encode(gen_random_bytes(8), 'hex'),
  status      text not null default 'active' check (status in ('active','suspended')),
  created_at  timestamptz not null default now()
);

-- The secret that signs card QR codes. In its own schema, which the website can't read.
create schema if not exists private;
revoke all on schema private from public;
create table if not exists private.card_key (id int primary key default 1 check (id = 1), k bytea not null);
insert into private.card_key (k) values (gen_random_bytes(32)) on conflict (id) do nothing;

-- A card's QR code changes every 30 seconds, so a screenshot stops working after about 2 minutes.
create or replace function public.card_sig(code text, w bigint) returns text
language sql stable security definer set search_path = public, extensions, private as $$
  select left(encode(hmac(convert_to(code || '.' || w::text, 'UTF8'), (select k from private.card_key where id = 1), 'sha256'), 'hex'), 12);
$$;
revoke all on function public.card_sig(text, bigint) from public, anon, authenticated;

create or replace function public.join_card(p_first_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  insert into public.members (user_id, first_name) values (auth.uid(), trim(p_first_name))
  on conflict (user_id) do update set first_name = excluded.first_name;
end $$;

create or replace function public.my_card() returns json
language plpgsql stable security definer set search_path = public, extensions, private as $$
declare m public.members; w bigint;
begin
  select * into m from public.members where user_id = auth.uid();
  if not found then return null; end if;
  w := floor(extract(epoch from now()) / 30)::bigint;
  return json_build_object(
    'first_name', m.first_name, 'since', m.created_at, 'status', m.status,
    'token', case when m.status = 'active' then m.card_code || '.' || w || '.' || public.card_sig(m.card_code, w) end,
    'server_time', now());
end $$;

create or replace function public.verify_card(t text) returns json
language plpgsql stable security definer set search_path = public, extensions, private as $$
declare parts text[]; m public.members; w bigint; now_w bigint;
begin
  parts := string_to_array(coalesce(t, ''), '.');
  if array_length(parts, 1) <> 3 or parts[2] !~ '^[0-9]{1,12}$' then
    return json_build_object('valid', false, 'reason', 'not_a_card');
  end if;
  select * into m from public.members where card_code = parts[1];
  if not found then return json_build_object('valid', false, 'reason', 'not_a_card'); end if;
  w := parts[2]::bigint;
  now_w := floor(extract(epoch from now()) / 30)::bigint;
  if public.card_sig(m.card_code, w) <> parts[3] then return json_build_object('valid', false, 'reason', 'not_a_card'); end if;
  if m.status <> 'active' then return json_build_object('valid', false, 'reason', 'suspended'); end if;
  if w < now_w - 4 or w > now_w + 1 then
    return json_build_object('valid', false, 'reason', 'expired', 'first_name', m.first_name);
  end if;
  return json_build_object('valid', true, 'first_name', m.first_name, 'since', m.created_at, 'checked_at', now());
end $$;

revoke all on function public.join_card(text) from public, anon;
grant execute on function public.join_card(text) to authenticated;
revoke all on function public.my_card() from public, anon;
grant execute on function public.my_card() to authenticated;
grant execute on function public.verify_card(text) to anon, authenticated;

-- ---------- Row level security ----------
alter table public.events      enable row level security;
alter table public.deals       enable row level security;
alter table public.recipes     enable row level security;
alter table public.suggestions enable row level security;
alter table public.members     enable row level security;

drop policy if exists "Public reads published events" on public.events;
create policy "Public reads published events" on public.events for select using (status = 'published' or public.is_admin());
drop policy if exists "Admins manage events" on public.events;
create policy "Admins manage events" on public.events for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads published deals" on public.deals;
create policy "Public reads published deals" on public.deals for select using (status = 'published' or public.is_admin());
drop policy if exists "Admins manage deals" on public.deals;
create policy "Admins manage deals" on public.deals for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads published recipes" on public.recipes;
create policy "Public reads published recipes" on public.recipes for select using (status = 'published' or public.is_admin());
drop policy if exists "Admins manage recipes" on public.recipes;
create policy "Admins manage recipes" on public.recipes for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone can send a suggestion" on public.suggestions;
create policy "Anyone can send a suggestion" on public.suggestions for insert with check (status = 'new');
drop policy if exists "Admins manage suggestions" on public.suggestions;
create policy "Admins manage suggestions" on public.suggestions for all using (public.is_admin()) with check (public.is_admin());

-- Members only ever see their own row; joining goes through join_card() above.
drop policy if exists "Members see their own row" on public.members;
create policy "Members see their own row" on public.members for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "Admins manage members" on public.members;
create policy "Admins manage members" on public.members for all using (public.is_admin()) with check (public.is_admin());
