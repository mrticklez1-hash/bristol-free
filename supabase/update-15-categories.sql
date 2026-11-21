-- Update 15: new categories, a second category per listing, two new facilities (Nov 2026)
-- Run this BEFORE the site update that uses the new categories goes live.
-- Safe to run more than once. Paste into Supabase > SQL Editor and click Run.

-- ---------- 1. Allow the 21 categories ----------
-- Codes never change; only the labels people see (set in js/data.js) do.
alter table public.listings drop constraint if exists listings_category_check;
alter table public.listings add constraint listings_category_check check (category in (
  -- Things to do
  'play','daysout','entertainment','outdoors','sport',
  -- Learn & grow
  'classes','toddler','holiday','community','tutoring',
  -- Eat & shop
  'cafes','shops',
  -- Look after
  'baby','hair','health','childcare','support',
  -- Celebrate
  'parties','entertainers','partyextras','photographers'
));

-- ---------- 2. Optional extra categories ----------
-- e.g. a bowling alley: category 'entertainment', extra_categories '{parties}'.
-- It then shows under both. Empty by default.
alter table public.listings add column if not exists extra_categories text[] not null default '{}';
alter table public.listings drop constraint if exists listings_extra_categories_check;
alter table public.listings add constraint listings_extra_categories_check check (extra_categories <@ array[
  'play','daysout','entertainment','outdoors','sport',
  'classes','toddler','holiday','community','tutoring',
  'cafes','shops',
  'baby','hair','health','childcare','support',
  'parties','entertainers','partyextras','photographers'
]::text[] and cardinality(extra_categories) <= 3);
create index if not exists listings_extra_categories_idx on public.listings using gin (extra_categories);

-- ---------- 3. Two new facilities: creche, changing_places ----------
alter table public.listing_facilities drop constraint if exists listing_facilities_facility_check;
alter table public.listing_facilities add constraint listing_facilities_facility_check check (facility in (
  'pushchair','baby_changing','toilets','accessible_toilet','step_free',
  'free_parking','paid_parking','cafe','high_chairs','indoor','outdoor',
  'picnic','dog_friendly','feeding','quiet_send','creche','changing_places'));

create or replace function public.check_listing_report() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text; v text;
begin
  if new.facilities is not null then
    for k, v in select key, value #>> '{}' from jsonb_each(new.facilities) loop
      if k not in ('pushchair','baby_changing','toilets','accessible_toilet','step_free','free_parking','paid_parking',
                   'cafe','high_chairs','indoor','outdoor','picnic','dog_friendly','feeding','quiet_send',
                   'creche','changing_places')
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

-- ---------- 4. Move existing listings into the new categories ----------
-- Matches on name. Any name not in your database is simply skipped.

-- Days out & attractions
update public.listings set category = 'daysout'
where name in ('Wild Woods Adventure Farm');

-- Entertainment, still shown under Party venues too
update public.listings set category = 'entertainment',
  extra_categories = array(select distinct unnest(extra_categories || '{parties}'::text[]))
where name in ('Tenpin Bristol', 'King Pins Bristol', 'TeamSport Bristol Karting and Laser Combat',
  'Clip ''n Climb Bristol', 'Glazed and Confused Pottery Painting', 'Kiln Workshop', 'Mini Potters');

-- Children's entertainers
update public.listings set category = 'entertainers'
where name in ('Chris P Tee Magician', 'Johnny G Children''s Entertainer', 'Kids Zone Disco',
  'Lucy Lost-it', 'Marky Jay', 'The Great Jaydini', 'Party Pandas');

-- Party extras
update public.listings set category = 'partyextras'
where name in ('Bounce Bonanza Hire');

-- Pregnancy & new baby
update public.listings set category = 'baby'
where name in ('Baby Sensory Bristol East', 'Baby Sensory Bristol North', 'Baby Sensory Bristol South',
  'The Little Sensory Co, Central Bristol', 'TinyTalk Baby Signing Bristol', 'Rock Out Baby Bristol',
  'Tiny Toes Baby Massage');

-- Baby & toddler groups
update public.listings set category = 'toddler'
where name in ('Gymboree Play & Music Bristol', 'Jo Jingles Bristol',
  'The Jolly Melodies Music Company, Bristol', 'The Jolly Melodies Music Company, Yate');

-- Library rhyme time: toddler group, also under Libraries & community
update public.listings set category = 'toddler',
  extra_categories = array(select distinct unnest(extra_categories || '{community}'::text[]))
where name in ('Library Rhyme Time');

-- Libraries & community (children's centres keep Childcare as a second category)
update public.listings set category = 'community',
  extra_categories = array(select distinct unnest(extra_categories || '{childcare}'::text[]))
where name in ('Bedminster Children''s Centre', 'Bishopsworth Children''s Centre', 'Hartcliffe Children''s Centre',
  'Knowle West Children''s Centre (Inns Court)', 'Redcliffe Children''s Centre', 'Stockwood Children''s Centre');

update public.listings set category = 'community'
where name in ('Children''s Scrapstore');

-- Check the result: one row per category with its count
select category, count(*) from public.listings group by category order by category;
