-- Update 11: "I'd love a family deal here" wishes (Nov 2026)
-- Parents tap a button on a listing with no deal yet. One wish per family card
-- account, or per device for people who aren't signed in. Counts give you
-- evidence when you ask a business to offer a deal.
-- Safe to run more than once. Paste into Supabase > SQL Editor and click Run.

create table if not exists public.deal_wishes (
  listing_id  uuid not null references public.listings(id) on delete cascade,
  voter       text not null check (voter ~ '^(u|d):[A-Za-z0-9-]{16,64}$'),  -- u: card account, d: device
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (listing_id, voter)
);
create index if not exists deal_wishes_anon_day on public.deal_wishes (listing_id, created_at) where user_id is null;
alter table public.deal_wishes enable row level security;
drop policy if exists "Admins read wishes" on public.deal_wishes;
create policy "Admins read wishes" on public.deal_wishes for select using (public.is_admin());

-- Tap = wish, tap again = take it back. Anonymous wishes are capped at 30 per place per day.
create or replace function public.toggle_wish(p_listing uuid, p_device text default null) returns json
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v text; dv text; wished boolean; n int;
begin
  if p_device is not null and p_device !~ '^[A-Za-z0-9-]{16,64}$' then p_device := null; end if;
  if uid is null and p_device is null then return json_build_object('ok', false, 'reason', 'no_device'); end if;
  if not exists (select 1 from public.listings where id = p_listing and status = 'published') then
    return json_build_object('ok', false, 'reason', 'no_listing');
  end if;
  dv := case when p_device is not null then 'd:' || p_device end;
  v := case when uid is not null then 'u:' || uid::text else dv end;

  if uid is not null and dv is not null and exists (select 1 from public.deal_wishes where listing_id = p_listing and voter = dv) then
    -- signed in on a device that already wished: move that wish onto their account
    delete from public.deal_wishes where listing_id = p_listing and voter = dv;
    insert into public.deal_wishes (listing_id, voter, user_id) values (p_listing, v, uid) on conflict do nothing;
    wished := true;
  elsif exists (select 1 from public.deal_wishes where listing_id = p_listing and voter = v) then
    delete from public.deal_wishes where listing_id = p_listing and voter = v;
    wished := false;
  else
    if uid is null and (select count(*) from public.deal_wishes
        where listing_id = p_listing and user_id is null and created_at > now() - interval '1 day') >= 30 then
      return json_build_object('ok', false, 'reason', 'busy');
    end if;
    insert into public.deal_wishes (listing_id, voter, user_id) values (p_listing, v, uid);
    wished := true;
  end if;
  select count(*) into n from public.deal_wishes where listing_id = p_listing;
  return json_build_object('ok', true, 'wished', wished, 'n', n);
end $$;

-- Public totals per listing (no details of who)
create or replace function public.wish_counts() returns table (listing_id uuid, n int)
language sql stable security definer set search_path = public as $$
  select w.listing_id, count(*)::int from public.deal_wishes w
  join public.listings l on l.id = w.listing_id and l.status = 'published'
  group by w.listing_id
$$;

-- Admin: ranked list with how many came from card holders
create or replace function public.wish_stats() returns table (listing_id uuid, name text, category text, area text, total int, members int, last_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query
    select l.id, l.name, l.category, l.area, count(*)::int, count(w.user_id)::int, max(w.created_at)
    from public.deal_wishes w join public.listings l on l.id = w.listing_id
    group by l.id, l.name, l.category, l.area
    order by count(*) desc, l.name;
end $$;

revoke all on function public.toggle_wish(uuid, text) from public;
grant execute on function public.toggle_wish(uuid, text) to anon, authenticated;
revoke all on function public.wish_counts() from public;
grant execute on function public.wish_counts() to anon, authenticated;
revoke all on function public.wish_stats() from public, anon;
grant execute on function public.wish_stats() to authenticated;
