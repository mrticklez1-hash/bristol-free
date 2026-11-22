-- Update 20: load listings from the research Google Sheet (Nov 2026)
-- Needs update-15-categories and update-16-smarter-matching first. Safe to run more than once.
--
-- How it's used:
--   1. Download the approved rows from the Sheet as CSV.
--   2. Supabase > Table Editor > listing_import > Insert > Import data from CSV.
--   3. SQL Editor:  select * from public.load_listing_import();
--   4. Read the summary. Rows marked "needs fixing" or "possible duplicate" stay in listing_import
--      (see listing_import_log for why); everything else is loaded and cleared.

-- ---------- 1. The holding table (every column is plain text, so a CSV upload never fails) ----------
create table if not exists public.listing_import (
  ref               text primary key,   -- the Sheet's own reference, e.g. R0042
  name              text,
  category          text,
  extra_categories  text,               -- comma separated, e.g. "parties, cafes"
  area              text,
  description       text,
  address           text,
  postcode          text,
  website           text,
  phone             text,
  opening_hours     text,
  price_band        text,               -- 0, 1, 2 or 3
  ages              text,               -- comma separated: baby, toddler, kids, teen
  parking_note      text,
  google_place_id   text,
  image_url         text,
  photo_credit      text,
  facilities_yes    text,               -- comma separated facility keys
  facilities_no     text,               -- comma separated facility keys
  facilities_source text,
  checked_on        text,               -- YYYY-MM-DD
  source            text,               -- where the details came from
  notes             text                -- free notes for the reviewer; never loaded
);
alter table public.listing_import enable row level security;
drop policy if exists "Admins manage import" on public.listing_import;
create policy "Admins manage import" on public.listing_import for all using (public.is_admin()) with check (public.is_admin());

-- ---------- 2. What happened to each row ----------
create table if not exists public.listing_import_log (
  id          bigint generated always as identity primary key,
  run_id      uuid not null,
  run_at      timestamptz not null default now(),
  ref         text,
  name        text,
  postcode    text,
  outcome     text not null,
  detail      text,
  listing_id  uuid references public.listings(id) on delete set null
);
alter table public.listing_import_log enable row level security;
drop policy if exists "Admins read import log" on public.listing_import_log;
create policy "Admins read import log" on public.listing_import_log for select using (public.is_admin());

-- "a, b; c" -> {a,b,c}, lower case, blanks dropped
create or replace function public.split_list(t text) returns text[]
language sql immutable as $$
  select coalesce(array(
    select btrim(x) from unnest(regexp_split_to_array(lower(coalesce(t, '')), '[,;]')) x
    where btrim(x) <> ''), '{}'::text[])
$$;

-- ---------- 3. The loader ----------
create or replace function public.load_listing_import()
returns table (outcome text, rows bigint)
language plpgsql set search_path = public as $$
declare
  cats  text[] := array['play','daysout','entertainment','outdoors','sport','classes','toddler','holiday','community','tutoring',
                        'cafes','shops','baby','hair','health','childcare','support','parties','entertainers','partyextras','photographers'];
  areas text[] := array['Central Bristol','North Bristol','South Bristol','East Bristol','Bradley Stoke','Keynsham',
                        'Portishead','Clevedon','Nailsea','Thornbury','Yate'];
  facs  text[] := array['pushchair','baby_changing','toilets','accessible_toilet','changing_places','step_free','free_parking',
                        'paid_parking','cafe','high_chairs','indoor','outdoor','picnic','dog_friendly','feeding','quiet_send','creche'];
  run uuid := gen_random_uuid();
  r public.listing_import;
  old public.listings;
  probs text[]; v_name text; v_cat text; v_xc text[]; v_area text; v_pc text; v_ages text[];
  fy text[]; fn text[]; v_chk date; v_src text; n int; lid uuid; filled int; fsaved int; k text; got int; res text;
  nb text;
begin
  for r in select * from public.listing_import order by ref loop
    probs := '{}';
    v_name := nullif(btrim(r.name), '');
    v_cat  := lower(nullif(btrim(r.category), ''));
    v_xc   := array_remove(public.split_list(r.extra_categories), v_cat);
    select a into v_area from unnest(areas) a where lower(a) = lower(btrim(coalesce(r.area, '')));
    v_pc   := nullif(upper(regexp_replace(btrim(coalesce(r.postcode, '')), '\s+', ' ', 'g')), '');
    v_ages := public.split_list(r.ages);
    fy     := public.split_list(r.facilities_yes);
    fn     := public.split_list(r.facilities_no);
    v_src  := nullif(btrim(coalesce(r.facilities_source, r.source, '')), '');
    v_chk  := null;

    if v_name is null then probs := probs || 'name is missing'::text; end if;
    if v_cat is null or not v_cat = any(cats) then probs := probs || format('unknown category "%s"', coalesce(r.category, '')); end if;
    if not v_xc <@ cats then probs := probs || 'unknown extra category'::text; end if;
    if cardinality(v_xc) > 3 then probs := probs || 'more than 3 extra categories'::text; end if;
    if v_area is null then probs := probs || format('unknown area "%s"', coalesce(r.area, '')); end if;
    if coalesce(r.price_band, '') !~ '^\s*[0-3]\s*$' then probs := probs || 'price_band must be 0, 1, 2 or 3'::text; end if;
    if not v_ages <@ array['baby','toddler','kids','teen'] then probs := probs || 'ages can only be baby, toddler, kids, teen'::text; end if;
    if not (fy || fn) <@ facs then probs := probs || 'unknown facility key'::text; end if;
    if fy && fn then probs := probs || 'a facility is in both yes and no'::text; end if;
    if nullif(btrim(r.website), '') is not null and btrim(r.website) !~* '^https?://' then probs := probs || 'website must start with https://'::text; end if;
    if char_length(coalesce(r.parking_note, '')) > 160 then probs := probs || 'parking_note over 160 characters'::text; end if;
    if char_length(coalesce(r.google_place_id, '')) > 300 then probs := probs || 'google_place_id too long'::text; end if;
    if char_length(coalesce(r.photo_credit, '')) > 300 then probs := probs || 'photo_credit over 300 characters'::text; end if;
    if nullif(btrim(r.checked_on), '') is not null then
      begin v_chk := btrim(r.checked_on)::date;
      exception when others then probs := probs || 'checked_on must be a date like 2026-11-22'::text; end;
    end if;

    if cardinality(probs) > 0 then
      insert into public.listing_import_log (run_id, ref, name, postcode, outcome, detail)
      values (run, r.ref, r.name, r.postcode, 'needs fixing (kept)', array_to_string(probs, '; '));
      continue;
    end if;

    select count(*), (array_agg(l.id))[1] into n, lid
    from public.listings l where public.same_place(l.name, l.postcode, v_name, v_pc);

    if n > 1 then
      insert into public.listing_import_log (run_id, ref, name, postcode, outcome, detail)
      values (run, r.ref, r.name, r.postcode, 'possible duplicate (kept)',
              (select 'matches ' || string_agg(l.name || coalesce(' ' || l.postcode, ''), ' / ')
               from public.listings l where public.same_place(l.name, l.postcode, v_name, v_pc)));
      continue;
    end if;

    filled := 0;
    if n = 0 then
      insert into public.listings (name, category, extra_categories, area, description, address, postcode, website, phone,
        opening_hours, price_band, ages, parking_note, google_place_id, image_url, photo_credit, last_checked, status, claimed, featured)
      values (v_name, v_cat, v_xc, v_area, nullif(btrim(r.description), ''), nullif(btrim(r.address), ''), v_pc,
        nullif(btrim(r.website), ''), nullif(btrim(r.phone), ''), nullif(btrim(r.opening_hours), ''), btrim(r.price_band)::smallint,
        v_ages, nullif(btrim(r.parking_note), ''), nullif(btrim(r.google_place_id), ''), nullif(btrim(r.image_url), ''),
        nullif(btrim(r.photo_credit), ''), v_chk, 'draft', false, false)
      returning id into lid;
      res := 'added as draft';
    else
      select * into old from public.listings where id = lid;
      if old.claimed then
        res := 'claimed, left alone';
      else
        -- count the blanks this row can fill
        filled := (case when nullif(old.description, '') is null and nullif(btrim(r.description), '') is not null then 1 else 0 end)
                + (case when nullif(old.address, '') is null and nullif(btrim(r.address), '') is not null then 1 else 0 end)
                + (case when nullif(old.postcode, '') is null and v_pc is not null then 1 else 0 end)
                + (case when nullif(old.website, '') is null and nullif(btrim(r.website), '') is not null then 1 else 0 end)
                + (case when nullif(old.phone, '') is null and nullif(btrim(r.phone), '') is not null then 1 else 0 end)
                + (case when nullif(old.opening_hours, '') is null and nullif(btrim(r.opening_hours), '') is not null then 1 else 0 end)
                + (case when nullif(old.parking_note, '') is null and nullif(btrim(r.parking_note), '') is not null then 1 else 0 end)
                + (case when nullif(old.google_place_id, '') is null and nullif(btrim(r.google_place_id), '') is not null then 1 else 0 end)
                + (case when nullif(old.image_url, '') is null and nullif(btrim(r.image_url), '') is not null then 1 else 0 end)
                + (case when cardinality(old.ages) = 0 and cardinality(v_ages) > 0 then 1 else 0 end)
                + (case when cardinality(old.extra_categories) = 0 and cardinality(v_xc) > 0 then 1 else 0 end);
        update public.listings l set
          description     = coalesce(nullif(l.description, ''), nullif(btrim(r.description), '')),
          address         = coalesce(nullif(l.address, ''), nullif(btrim(r.address), '')),
          postcode        = coalesce(nullif(l.postcode, ''), v_pc),
          website         = coalesce(nullif(l.website, ''), nullif(btrim(r.website), '')),
          phone           = coalesce(nullif(l.phone, ''), nullif(btrim(r.phone), '')),
          opening_hours   = coalesce(nullif(l.opening_hours, ''), nullif(btrim(r.opening_hours), '')),
          parking_note    = coalesce(nullif(l.parking_note, ''), nullif(btrim(r.parking_note), '')),
          google_place_id = coalesce(nullif(l.google_place_id, ''), nullif(btrim(r.google_place_id), '')),
          photo_credit    = case when nullif(l.image_url, '') is null and nullif(btrim(r.image_url), '') is not null
                                 then nullif(btrim(r.photo_credit), '') else l.photo_credit end,
          image_url       = coalesce(nullif(l.image_url, ''), nullif(btrim(r.image_url), '')),
          ages            = case when cardinality(l.ages) = 0 then v_ages else l.ages end,
          extra_categories = case when cardinality(l.extra_categories) = 0 then v_xc else l.extra_categories end,
          last_checked    = case when v_chk is null then l.last_checked else greatest(coalesce(l.last_checked, v_chk), v_chk) end
        where l.id = lid;
        res := case when filled > 0 then 'gaps filled' else 'already listed, nothing new' end;
      end if;
    end if;

    -- facilities: research never overwrites a parent's or business's answer
    fsaved := 0;
    foreach k in array fy || fn loop
      insert into public.listing_facilities (listing_id, facility, value, source, confirmed_by, checked_on)
      values (lid, k, case when k = any(fy) then 'yes' else 'no' end, left(v_src, 300), 'research', coalesce(v_chk, current_date))
      on conflict (listing_id, facility) do update
        set value = excluded.value, source = excluded.source, checked_on = excluded.checked_on
        where public.listing_facilities.confirmed_by = 'research';
      get diagnostics got = row_count;
      fsaved := fsaved + got;
    end loop;

    nb := concat_ws('; ',
      case when filled > 0 then filled || ' blank field(s) filled' end,
      case when fsaved > 0 then fsaved || ' facilit' || case when fsaved = 1 then 'y' else 'ies' end || ' saved' end,
      case when cardinality(fy || fn) > fsaved then (cardinality(fy || fn) - fsaved) || ' facility answer(s) skipped (already confirmed by a parent or business)' end);
    insert into public.listing_import_log (run_id, ref, name, postcode, outcome, detail, listing_id)
    values (run, r.ref, v_name, v_pc, res, nullif(nb, ''), lid);
    delete from public.listing_import where ref = r.ref;
  end loop;

  return query
    select g.outcome, count(*) from public.listing_import_log g where g.run_id = run group by g.outcome
    union all
    select 'facility answers saved', coalesce(sum((regexp_match(g.detail, '(\d+) facilit(?:y|ies) saved'))[1]::int), 0)
      from public.listing_import_log g where g.run_id = run
    order by 1;
end $$;

revoke all on function public.load_listing_import() from public, anon, authenticated;

-- To see each row from the last run, with reasons:
--   select ref, name, outcome, detail from public.listing_import_log
--   where run_id = (select run_id from public.listing_import_log order by id desc limit 1) order by ref;
