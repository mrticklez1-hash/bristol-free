-- Batch 6: Red Dragons Martial Arts, 4 venues (Nov 2026)
-- 4 listings. Loads as UNCLAIMED DRAFTS: nothing shows until you publish each one in admin.
-- Safe to run more than once: any listing whose name is already in the database is skipped.
-- After running, click 'Place missing map pins' in admin. Mobile entertainers have no address, so no pin.
-- Paste into Supabase > SQL Editor and click Run.
insert into public.listings (name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages, status, claimed, featured)
select v.name, v.category, v.area, v.description, v.address, v.postcode, v.website, v.phone, v.opening_hours, v.price_band, v.ages, 'draft', v.claimed, false
from (values
  -- source: Richard (checked Nov 2026); reddragonsmartialarts.com
  ('Red Dragons Martial Arts, Bishopston', 'sport', 'North Bristol', 'Martial arts classes for children aged 4 and up, building confidence, discipline, balance and coordination. Led by Lloyd Lewis, a two-time world kickboxing champion. Free trial class available.', 'Bishopston Methodist Church, 245 Gloucester Road', 'BS7 8NY', 'https://www.reddragonsmartialarts.com/', null, null, 2, array['kids']::text[], false),
  -- source: Richard (checked Nov 2026); reddragonsmartialarts.com
  ('Red Dragons Martial Arts, Henleaze', 'sport', 'North Bristol', 'Martial arts classes for children aged 4 and up, building confidence, discipline, balance and coordination. Led by Lloyd Lewis, a two-time world kickboxing champion. Free trial class available.', '227th Scout Hall, Baldwin Lodge, Eastfield Terrace, Henleaze', 'BS9 4AR', 'https://www.reddragonsmartialarts.com/', null, null, 2, array['kids']::text[], false),
  -- source: Richard (checked Nov 2026); reddragonsmartialarts.com
  ('Red Dragons Martial Arts, Horfield', 'sport', 'North Bristol', 'Martial arts classes for children aged 4 and up, building confidence, discipline, balance and coordination. Led by Lloyd Lewis, a two-time world kickboxing champion. Free trial class available.', 'Horfield Methodist Church, 1 Churchways Avenue', 'BS7 8SN', 'https://www.reddragonsmartialarts.com/', null, null, 2, array['kids']::text[], false),
  -- source: Richard (checked Nov 2026); reddragonsmartialarts.com
  ('Red Dragons Martial Arts, Pill', 'sport', 'Portishead', 'Martial arts classes for children aged 4 and up, building confidence, discipline, balance and coordination. Led by Lloyd Lewis, a two-time world kickboxing champion. Free trial class available.', 'Pill Community Centre, Church Place, Pill', 'BS20 0AE', 'https://www.reddragonsmartialarts.com/', null, null, 2, array['kids']::text[], false)
) as v(name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages, claimed)
where not exists (select 1 from public.listings l where lower(l.name) = lower(v.name));
