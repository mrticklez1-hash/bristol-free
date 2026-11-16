-- Update 07: businesses scan family cards to apply deals (Nov 2026).
-- Savings are recorded on the family's card and counted for the business automatically.
-- Paste into Supabase > SQL Editor and click Run. Safe to run more than once.

create extension if not exists "pgcrypto";

-- How each deal's saving is worked out
alter table public.deals add column if not exists kind text not null default 'fixed';
alter table public.deals add column if not exists value numeric(7,2);       -- £ for fixed, % for the percentage kinds
alter table public.deals add column if not exists item_price numeric(7,2);  -- the set price, for "% off a set price"
alter table public.deals drop constraint if exists deals_kind_check;
alter table public.deals add constraint deals_kind_check check (kind in ('fixed','percent_item','percent_bill'));

-- Where a saving came from: typed in by the family, or recorded by a business scan
alter table public.member_savings add column if not exists source text not null default 'manual';
alter table public.member_savings drop constraint if exists member_savings_source_check;
alter table public.member_savings add constraint member_savings_source_check check (source in ('manual','scan'));

-- One private link per business phone/tablet. Only a scrambled copy of the key is stored.
create table if not exists public.business_keys (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null check (char_length(business_name) <= 200),
  listing_id    uuid references public.listings(id) on delete set null,
  key_hash      text not null unique,
  revoked       boolean not null default false,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

create table if not exists public.redemptions (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  key_id      uuid references public.business_keys(id) on delete set null,
  amount      numeric(7,2) not null,
  bill        numeric(8,2),
  london_day  date not null default (now() at time zone 'Europe/London')::date,
  created_at  timestamptz not null default now(),
  unique (deal_id, user_id, london_day)          -- a deal can only be applied once a day per card
);
create index if not exists redemptions_deal_idx on public.redemptions (deal_id, created_at desc);

alter table public.business_keys enable row level security;
alter table public.redemptions   enable row level security;
drop policy if exists "Admins manage business keys" on public.business_keys;
create policy "Admins manage business keys" on public.business_keys for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins read redemptions" on public.redemptions;
create policy "Admins read redemptions" on public.redemptions for all using (public.is_admin()) with check (public.is_admin());

-- ---------- helpers (not callable from the website directly) ----------
create or replace function public.check_card(t text, slack int) returns public.members
language plpgsql stable security definer set search_path = public, extensions, private as $$
declare parts text[]; m public.members; w bigint; now_w bigint;
begin
  parts := string_to_array(coalesce(t, ''), '.');
  if array_length(parts, 1) <> 3 or parts[2] !~ '^[0-9]{1,12}$' then return null; end if;
  select * into m from public.members where card_code = parts[1];
  if not found or public.card_sig(m.card_code, parts[2]::bigint) <> parts[3] then return null; end if;
  w := parts[2]::bigint; now_w := floor(extract(epoch from now()) / 30)::bigint;
  if w < now_w - slack or w > now_w + 1 then m.status := 'expired'; end if;
  return m;
end $$;
revoke all on function public.check_card(text, int) from public, anon, authenticated;

create or replace function public.check_key(k text) returns public.business_keys
language sql stable security definer set search_path = public, extensions as $$
  select * from public.business_keys where key_hash = encode(digest(coalesce(k, ''), 'sha256'), 'hex') and not revoked;
$$;
revoke all on function public.check_key(text) from public, anon, authenticated;

create or replace function public.deal_saving(d public.deals, bill numeric) returns numeric
language sql immutable as $$
  select case d.kind
    when 'fixed' then d.value
    when 'percent_item' then round(d.item_price * d.value / 100, 2)
    when 'percent_bill' then case when bill > 0 then round(bill * d.value / 100, 2) end
  end;
$$;

-- deals belonging to the business a key was made for
create or replace function public.key_deals(bk public.business_keys) returns setof public.deals
language sql stable security definer set search_path = public as $$
  select * from public.deals d
  where d.status = 'published'
    and (d.valid_until is null or d.valid_until >= (now() at time zone 'Europe/London')::date)
    and ((bk.listing_id is not null and d.listing_id = bk.listing_id) or lower(d.business_name) = lower(bk.business_name))
  order by d.created_at;
$$;
revoke all on function public.key_deals(public.business_keys) from public, anon, authenticated;

-- ---------- called by the business's phone ----------
-- After a scan: is the card valid, and which deals can be applied?
create or replace function public.staff_check(p_key text, p_token text) returns json
language plpgsql security definer set search_path = public as $$
declare bk public.business_keys; m public.members; today date := (now() at time zone 'Europe/London')::date;
begin
  bk := public.check_key(p_key);
  if bk.id is null then return json_build_object('key_ok', false); end if;
  update public.business_keys set last_used_at = now() where id = bk.id;
  m := public.check_card(p_token, 4);
  if m.user_id is null then return json_build_object('key_ok', true, 'business', bk.business_name, 'valid', false, 'reason', 'not_a_card'); end if;
  if m.status = 'suspended' then return json_build_object('key_ok', true, 'business', bk.business_name, 'valid', false, 'reason', 'suspended'); end if;
  if m.status = 'expired' then return json_build_object('key_ok', true, 'business', bk.business_name, 'valid', false, 'reason', 'expired', 'first_name', m.first_name); end if;
  return json_build_object('key_ok', true, 'business', bk.business_name, 'valid', true, 'first_name', m.first_name, 'since', m.created_at,
    'deals', coalesce((select json_agg(json_build_object('id', d.id, 'badge', d.badge, 'offer', d.offer, 'kind', d.kind, 'value', d.value,
        'estimate', public.deal_saving(d, null),
        'used_today', exists (select 1 from public.redemptions r where r.deal_id = d.id and r.user_id = m.user_id and r.london_day = today)))
      from public.key_deals(bk) d), '[]'::json));
end $$;

-- Staff tap "Apply": record it for the business and on the family's card.
-- The code is allowed to be a few minutes old here, so there's time to type a bill.
create or replace function public.staff_redeem(p_key text, p_token text, p_deal uuid, p_bill numeric default null) returns json
language plpgsql security definer set search_path = public as $$
declare bk public.business_keys; m public.members; d public.deals; amt numeric; rid uuid;
begin
  bk := public.check_key(p_key);
  if bk.id is null then return json_build_object('ok', false, 'reason', 'bad_key'); end if;
  m := public.check_card(p_token, 12);
  if m.user_id is null or m.status <> 'active' then return json_build_object('ok', false, 'reason', coalesce(m.status, 'not_a_card')); end if;
  select * into d from public.key_deals(bk) x where x.id = p_deal;
  if d.id is null then return json_build_object('ok', false, 'reason', 'not_your_deal'); end if;
  if d.kind = 'percent_bill' and (p_bill is null or p_bill <= 0 or p_bill > 5000) then return json_build_object('ok', false, 'reason', 'need_bill'); end if;
  amt := public.deal_saving(d, p_bill);
  if amt is null or amt <= 0 then return json_build_object('ok', false, 'reason', 'no_amount'); end if;
  insert into public.redemptions (deal_id, user_id, key_id, amount, bill) values (d.id, m.user_id, bk.id, amt, case when d.kind = 'percent_bill' then p_bill end)
    on conflict (deal_id, user_id, london_day) do nothing returning id into rid;
  if rid is null then return json_build_object('ok', false, 'reason', 'used_today'); end if;
  insert into public.member_savings (user_id, deal_id, label, amount, source)
    values (m.user_id, d.id, left(d.business_name || ': ' || d.offer, 120), least(amt, 1000), 'scan');
  return json_build_object('ok', true, 'amount', amt, 'first_name', m.first_name);
end $$;

-- The business's own numbers, for their staff page
create or replace function public.staff_stats(p_key text) returns json
language plpgsql stable security definer set search_path = public as $$
declare bk public.business_keys; m0 timestamptz := date_trunc('month', now() at time zone 'Europe/London') at time zone 'Europe/London';
begin
  bk := public.check_key(p_key);
  if bk.id is null then return json_build_object('key_ok', false); end if;
  return json_build_object('key_ok', true, 'business', bk.business_name,
    'month_uses', (select count(*) from public.redemptions r join public.key_deals(bk) d on d.id = r.deal_id where r.created_at >= m0),
    'month_saved', (select coalesce(sum(r.amount), 0) from public.redemptions r join public.key_deals(bk) d on d.id = r.deal_id where r.created_at >= m0),
    'all_uses', (select count(*) from public.redemptions r join public.key_deals(bk) d on d.id = r.deal_id),
    'all_saved', (select coalesce(sum(r.amount), 0) from public.redemptions r join public.key_deals(bk) d on d.id = r.deal_id),
    'families', (select count(distinct r.user_id) from public.redemptions r join public.key_deals(bk) d on d.id = r.deal_id),
    'deals', coalesce((select json_agg(json_build_object('offer', d.offer, 'badge', d.badge,
        'month_uses', (select count(*) from public.redemptions r where r.deal_id = d.id and r.created_at >= m0),
        'all_uses', (select count(*) from public.redemptions r where r.deal_id = d.id))) from public.key_deals(bk) d), '[]'::json));
end $$;

-- Admin makes a staff link. The full key is only ever shown this once.
create or replace function public.new_business_key(p_business text, p_listing uuid default null) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare k text := encode(gen_random_bytes(18), 'hex');
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  insert into public.business_keys (business_name, listing_id, key_hash) values (trim(p_business), p_listing, encode(digest(k, 'sha256'), 'hex'));
  return k;
end $$;

revoke all on function public.staff_check(text, text) from public;
revoke all on function public.staff_redeem(text, text, uuid, numeric) from public;
revoke all on function public.staff_stats(text) from public;
revoke all on function public.new_business_key(text, uuid) from public, anon;
grant execute on function public.staff_check(text, text) to anon, authenticated;
grant execute on function public.staff_redeem(text, text, uuid, numeric) to anon, authenticated;
grant execute on function public.staff_stats(text) to anon, authenticated;
grant execute on function public.new_business_key(text, uuid) to authenticated;

-- Families can't fake a "scanned" saving; scanned ones come only from staff_redeem above.
drop policy if exists "Members add own savings" on public.member_savings;
create policy "Members add own savings" on public.member_savings for insert
  with check (user_id = auth.uid() and source = 'manual' and exists (select 1 from public.members m where m.user_id = auth.uid()));
