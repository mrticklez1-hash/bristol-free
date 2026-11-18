-- Update 9: lifetime family cards and one-off invite codes (Nov 2026)
-- Lets you give someone (e.g. a founding tester) a free card for as long as the scheme runs.
-- Two ways: send them a one-off invite code, or tick "Make lifetime" on their card in admin.
-- Safe to run more than once. Paste into Supabase > SQL Editor and click Run.

create extension if not exists "pgcrypto";

-- Each card is standard or lifetime
alter table public.members add column if not exists plan text not null default 'standard';
alter table public.members drop constraint if exists members_plan_check;
alter table public.members add constraint members_plan_check check (plan in ('standard','lifetime'));
alter table public.members add column if not exists plan_note text;
alter table public.members drop constraint if exists members_plan_note_check;
alter table public.members add constraint members_plan_note_check check (plan_note is null or char_length(plan_note) <= 200);

-- One-off codes, e.g. TESTER-7K2P9Q. Each works once.
create table if not exists public.invite_codes (
  code        text primary key check (code ~ '^[A-Z0-9-]{6,32}$'),
  plan        text not null default 'lifetime' check (plan in ('lifetime')),
  note        text check (note is null or char_length(note) <= 200),   -- who it's for, e.g. "Founding tester: Jo"
  created_at  timestamptz not null default now(),
  used_by     uuid references auth.users(id) on delete set null,
  used_at     timestamptz
);
alter table public.invite_codes enable row level security;
drop policy if exists "Admins manage invite codes" on public.invite_codes;
create policy "Admins manage invite codes" on public.invite_codes for all using (public.is_admin()) with check (public.is_admin());

-- Failed code attempts, so nobody can guess codes by trying thousands
create schema if not exists private;
create table if not exists private.invite_attempts (user_id uuid not null, at timestamptz not null default now());
create index if not exists invite_attempts_user on private.invite_attempts (user_id, at);

-- Admin: make a new code
create or replace function public.new_invite_code(p_note text default null) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text; b bytea; i int;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  loop
    b := gen_random_bytes(6); c := 'TESTER-';
    for i in 0..5 loop c := c || substr(alphabet, (get_byte(b, i) % length(alphabet)) + 1, 1); end loop;
    begin
      insert into public.invite_codes (code, note) values (c, nullif(trim(left(coalesce(p_note, ''), 200)), ''));
      return c;
    exception when unique_violation then -- try another
    end;
  end loop;
end $$;

-- Family: use a code on their own card
create or replace function public.redeem_invite(p_code text) returns json
language plpgsql security definer set search_path = public, private as $$
declare uid uuid := auth.uid(); m public.members; ic public.invite_codes; c text;
begin
  if uid is null then raise exception 'Please sign in first'; end if;
  select * into m from public.members where user_id = uid;
  if not found then return json_build_object('ok', false, 'reason', 'no_card'); end if;
  if m.plan = 'lifetime' then return json_build_object('ok', true, 'plan', 'lifetime', 'already', true); end if;
  if (select count(*) from private.invite_attempts where user_id = uid and at > now() - interval '1 hour') >= 8 then
    return json_build_object('ok', false, 'reason', 'too_many');
  end if;
  c := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  if c !~ '-' and length(c) = 12 and c like 'TESTER%' then c := 'TESTER-' || substr(c, 7); end if;  -- typed without the dash
  update public.invite_codes set used_by = uid, used_at = now()
   where code = c and used_by is null returning * into ic;
  if not found then
    insert into private.invite_attempts (user_id) values (uid);
    return json_build_object('ok', false, 'reason', 'bad_code');
  end if;
  update public.members set plan = ic.plan, plan_note = coalesce(ic.note, plan_note) where user_id = uid;
  return json_build_object('ok', true, 'plan', ic.plan);
end $$;

-- The card now also says which plan it's on
create or replace function public.my_card() returns json
language plpgsql stable security definer set search_path = public, extensions, private as $$
declare m public.members; w bigint;
begin
  select * into m from public.members where user_id = auth.uid();
  if not found then return null; end if;
  w := floor(extract(epoch from now()) / 30)::bigint;
  return json_build_object(
    'first_name', m.first_name, 'since', m.created_at, 'status', m.status, 'plan', m.plan,
    'token', case when m.status = 'active' then m.card_code || '.' || w || '.' || public.card_sig(m.card_code, w) end,
    'server_time', now());
end $$;

revoke all on function public.new_invite_code(text) from public, anon;
grant execute on function public.new_invite_code(text) to authenticated;
revoke all on function public.redeem_invite(text) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;
revoke all on function public.my_card() from public, anon;
grant execute on function public.my_card() to authenticated;
