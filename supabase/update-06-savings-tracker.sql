-- Update 06: savings tracker on the family card (Nov 2026). Safe to run more than once.
create table if not exists public.member_savings (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  deal_id   uuid references public.deals(id) on delete set null,
  label     text not null check (char_length(label) between 1 and 120),
  amount    numeric(7,2) not null check (amount > 0 and amount <= 1000),
  saved_on  date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists member_savings_user_idx on public.member_savings (user_id, saved_on desc);
alter table public.member_savings enable row level security;

-- Members keep their own savings log; nobody else can see it.
drop policy if exists "Members read own savings" on public.member_savings;
create policy "Members read own savings" on public.member_savings for select using (user_id = auth.uid());
drop policy if exists "Members add own savings" on public.member_savings;
create policy "Members add own savings" on public.member_savings for insert
  with check (user_id = auth.uid() and exists (select 1 from public.members m where m.user_id = auth.uid()));
drop policy if exists "Members delete own savings" on public.member_savings;
create policy "Members delete own savings" on public.member_savings for delete using (user_id = auth.uid());

-- Total saved by all members together, for showing on the site (no personal details).
create or replace function public.total_member_savings() returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount), 0) from public.member_savings;
$$;
grant execute on function public.total_member_savings() to anon, authenticated;
