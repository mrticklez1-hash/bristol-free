-- Update 22: event pages, event locations and the nightly tidy-up of old events (Nov 2026)
-- Paste into Supabase > SQL Editor and click Run. Safe to run more than once.
--
-- 1. Every event gets a web address of its own (a "slug"), e.g. /event/christmas-lantern-making-12-dec
-- 2. Events can have a postcode, so ones not at a listed venue still get a map pin
-- 3. Every night at 3:15am:
--      - an event's photo is retired 30 days after the event (or its last weekly date) has finished
--      - the event itself is deleted 6 months after it finished
--    Weekly events only count as finished once their "repeats until" date has passed.
--    Retired photos are listed in event_photo_trash, and admin deletes the files from storage
--    the next time you open it (Supabase only lets photos be deleted that way).

-- ---------- 1 and 2: new columns ----------
alter table public.events add column if not exists slug     text;
alter table public.events add column if not exists photo_credit text check (char_length(photo_credit) <= 300);
alter table public.events add column if not exists postcode text check (char_length(postcode) <= 10);
create unique index if not exists events_slug_key on public.events (slug);

-- slug = title + day and month of the first date, e.g. "junior-parkrun-30-nov", with -2, -3… if taken
create or replace function public.event_slug(p_title text, p_at timestamptz, p_id uuid) returns text
language plpgsql stable set search_path = public as $$
declare base text; s text; n int := 1;
begin
  base := trim(both '-' from regexp_replace(lower(coalesce(p_title, 'event')), '[^a-z0-9]+', '-', 'g'));
  base := left(nullif(base, ''), 70);
  base := coalesce(base, 'event') || '-' || lower(to_char(p_at at time zone 'Europe/London', 'FMDD-Mon'));
  s := base;
  while exists (select 1 from public.events where slug = s and id is distinct from p_id) loop
    n := n + 1; s := base || '-' || n;
  end loop;
  return s;
end $$;

create or replace function public.events_set_slug() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.event_slug(new.title, new.starts_at, new.id);
  end if;
  if new.postcode is not null then new.postcode := nullif(upper(trim(new.postcode)), ''); end if;
  return new;
end $$;
drop trigger if exists events_slug on public.events;
create trigger events_slug before insert or update of title, slug, postcode on public.events
  for each row execute function public.events_set_slug();

-- give the events already in the database their slugs
update public.events set slug = null where slug is null or slug = '';

-- ---------- 3: the nightly tidy-up ----------
create table if not exists public.event_photo_trash (
  path       text primary key,          -- file path inside the listing-images storage
  queued_at  timestamptz not null default now()
);
alter table public.event_photo_trash enable row level security;
drop policy if exists "Admins manage event photo trash" on public.event_photo_trash;
create policy "Admins manage event photo trash" on public.event_photo_trash for all
  using (public.is_admin()) with check (public.is_admin());

-- when an event finished (end of its last weekly date for repeating events)
create or replace function public.event_finished_at(e public.events) returns timestamptz
language sql stable as $$
  select case when e.repeat_until is not null
              then ((e.repeat_until + 1)::timestamp at time zone 'Europe/London')
              else coalesce(e.ends_at, e.starts_at) end;
$$;

-- only photos in our own storage are queued, and never one still used by a listing, deal, recipe or another event
create or replace function public.queue_event_photo(p_url text, p_event uuid) returns void
language plpgsql security definer set search_path = public as $$
declare marker text := '/storage/v1/object/public/listing-images/'; p text;
begin
  if p_url is null or position(marker in p_url) = 0 then return; end if;
  p := split_part(substr(p_url, position(marker in p_url) + length(marker)), '?', 1);
  if exists (select 1 from public.listings where image_url = p_url)
     or exists (select 1 from public.recipes where image_url = p_url)
     or exists (select 1 from public.events where image_url = p_url and id <> p_event) then return; end if;
  insert into public.event_photo_trash (path) values (p) on conflict do nothing;
end $$;
revoke all on function public.queue_event_photo(text, uuid) from public, anon, authenticated;

create or replace function public.tidy_past_events() returns json
language plpgsql security definer set search_path = public as $$
declare r record; photos int := 0; removed int := 0;
begin
  -- photos: 30 days after the event finished
  for r in select id, image_url from public.events
           where image_url is not null and public.event_finished_at(events) < now() - interval '30 days' loop
    perform public.queue_event_photo(r.image_url, r.id);
    update public.events set image_url = null, photo_credit = null where id = r.id;
    photos := photos + 1;
  end loop;
  -- events: 6 months after they finished
  for r in select id, image_url from public.events
           where public.event_finished_at(events) < now() - interval '6 months' loop
    perform public.queue_event_photo(r.image_url, r.id);
    delete from public.events where id = r.id;
    removed := removed + 1;
  end loop;
  return json_build_object('photos_retired', photos, 'events_deleted', removed);
end $$;
revoke all on function public.tidy_past_events() from public, anon, authenticated;

-- schedule it every night at 3:15am (UK time is close enough: the server runs on UTC)
create extension if not exists pg_cron;
do $$
begin
  perform cron.unschedule('tidy-past-events');
exception when others then null;   -- wasn't scheduled yet
end $$;
select cron.schedule('tidy-past-events', '15 3 * * *', 'select public.tidy_past_events()');
