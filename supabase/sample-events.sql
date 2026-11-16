-- Sample events so the What's on calendar has something to show (Nov 2026).
-- They're marked "Sample event" in the description. To remove them all later, run:
--   delete from public.events where description like 'Sample event%';
-- Safe to run more than once (skips any already added).
insert into public.events (title, area, venue, starts_at, ends_at, repeat_until, price_band, price_note, ages, description, status)
select v.title, v.area, v.venue,
       (date_trunc('day', now() at time zone 'Europe/London') + v.d * interval '1 day' + v.s) at time zone 'Europe/London',
       (date_trunc('day', now() at time zone 'Europe/London') + v.d * interval '1 day' + v.e) at time zone 'Europe/London',
       case when v.weeks > 0 then (now() + v.weeks * interval '1 week')::date end,
       v.price_band, v.price_note, v.ages, v.description, 'published'
from (values
  ('Rhyme time for under-5s', 'Central Bristol', 'Library', 1, interval '10 hours 30 minutes', interval '11 hours', 10, 0, null, array['baby','toddler'], 'Sample event: songs, rhymes and stories for under-5s with a grown-up. Just turn up.'),
  ('Messy play stay & play', 'East Bristol', 'Community centre', 2, interval '9 hours 30 minutes', interval '11 hours', 8, 1, '£2 per family', array['baby','toddler'], 'Sample event: paint, playdough, sand and water. Old clothes recommended!'),
  ('Christmas lantern making', 'South Bristol', 'City farm', 3, interval '13 hours', interval '15 hours', 0, 1, '£3 per lantern', array['kids'], 'Sample event: make a willow and tissue lantern to take home. All materials included.'),
  ('Free swim for under-8s', 'Yate', 'Leisure centre', 4, interval '14 hours', interval '15 hours', 0, 0, null, array['toddler','kids'], 'Sample event: free swim session. One adult per two children.'),
  ('Junior 2k fun run', 'North Bristol', 'Park', 5, interval '9 hours', interval '9 hours 45 minutes', 12, 0, null, array['kids'], 'Sample event: free, timed 2k run for 4 to 14 year olds every week.'),
  ('Family film morning', 'Portishead', 'Village hall', 6, interval '10 hours', interval '11 hours 45 minutes', 0, 1, '£4, under-2s free', array['toddler','kids'], 'Sample event: relaxed screening with the lights half up. Bring a cushion.'),
  ('Santa''s grotto and farm day', 'Keynsham', 'Farm park', 9, interval '10 hours', interval '16 hours', 0, 3, null, array['toddler','kids'], 'Sample event: meet Santa, feed the animals and play in the barn.'),
  ('Toddler disco', 'East Bristol', 'Church hall', 1, interval '10 hours', interval '10 hours 45 minutes', 10, 1, '£3 per child', array['toddler'], 'Sample event: dancing, bubbles and parachute games for walkers to 4 year olds.')
) as v(title, area, venue, d, s, e, weeks, price_band, price_note, ages, description)
where not exists (select 1 from public.events x where x.title = v.title and x.description like 'Sample event%');
