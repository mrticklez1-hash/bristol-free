-- Update 13: "Update info or facilities" from parents (Nov 2026)
-- Parents confirm facilities, tell us something's changed, or that a place has closed.
-- Nothing goes live until you approve it in admin (the Updates tab).
-- Safe to run more than once. Paste into Supabase > SQL Editor and click Run.

create table if not exists public.listing_reports (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid not null references public.listings(id) on delete cascade,
  kind              text not null check (kind in ('facilities','change','closed')),
  facilities        jsonb check (facilities is null or (jsonb_typeof(facilities) = 'object' and pg_column_size(facilities) < 2000)),
  message           text check (message is null or char_length(message) <= 1000),
  visited_recently  boolean,
  status            text not null default 'new' check (status in ('new','done','dismissed')),
  created_at        timestamptz not null default now()
);
create index if not exists listing_reports_new on public.listing_reports (status, created_at desc);
alter table public.listing_reports enable row level security;
drop policy if exists "Anyone can send an update" on public.listing_reports;
create policy "Anyone can send an update" on public.listing_reports for insert to anon, authenticated
  with check (status = 'new' and exists (select 1 from public.listings l where l.id = listing_id and l.status = 'published'));
drop policy if exists "Admins manage updates" on public.listing_reports;
create policy "Admins manage updates" on public.listing_reports for all using (public.is_admin()) with check (public.is_admin());
grant insert on public.listing_reports to anon, authenticated;
grant select, update, delete on public.listing_reports to authenticated;

-- Only real facility keys and yes/no, and no more than 25 updates per place per day
create or replace function public.check_listing_report() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text; v text;
begin
  if new.facilities is not null then
    for k, v in select key, value #>> '{}' from jsonb_each(new.facilities) loop
      if k not in ('pushchair','baby_changing','toilets','accessible_toilet','step_free','free_parking','paid_parking',
                   'cafe','high_chairs','indoor','outdoor','picnic','dog_friendly','feeding','quiet_send')
         or v not in ('yes','no') then
        raise exception 'Unknown facility answer';
      end if;
    end loop;
  end if;
  if not public.is_admin() and (select count(*) from public.listing_reports
       where listing_id = new.listing_id and created_at > now() - interval '1 day') >= 25 then
    raise exception 'Too many updates for this place today';
  end if;
  return new;
end $$;
drop trigger if exists listing_reports_check on public.listing_reports;
create trigger listing_reports_check before insert on public.listing_reports for each row execute function public.check_listing_report();
