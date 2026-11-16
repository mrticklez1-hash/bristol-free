-- Update 04: approximate map pins for listings with no postcode (Nov 2026)
-- Pins sit on the town/district each business covers, never a home address.
-- Only fills listings that have no pin yet, so pins moved in admin are kept. Safe to re-run.
update public.listings l set lat = v.lat, lng = v.lng
from (values
  ('Johnny G Children''s Entertainer', 51.41100, -2.49690),
  ('The Great Jaydini', 51.47150, -2.54000),
  ('Lucy Lost-it', 51.45200, -2.58790),
  ('Chris P Tee Magician', 51.53770, -2.41080),
  ('Baby Sensory Bristol North', 51.48750, -2.59000),
  ('Baby Sensory Bristol South', 51.42950, -2.58600),
  ('Baby Sensory Bristol East', 51.47400, -2.54000),
  ('babyballet Bristol', 51.45450, -2.58790),
  ('Perform Bristol', 51.45700, -2.58790),
  ('Little Kickers Bristol', 51.49000, -2.59000),
  ('Rugbytots Bristol & Bath', 51.45200, -2.57990),
  ('Water Babies Bristol & Bath', 51.49250, -2.59000),
  ('Everyone Active swimming lessons', 51.45450, -2.57990),
  ('Bristol Karate Academy', 51.49050, -2.61700),
  ('Artemis BJJ Kids', 51.47650, -2.54000),
  ('The Jolly Melodies Music Company, Bristol', 51.48750, -2.58200),
  ('Kids Zone Disco', 51.44150, -2.51900),
  ('Marky Jay', 51.45700, -2.57990),
  ('Jo Jingles Bristol', 51.52750, -2.54700),
  ('TinyTalk Baby Signing Bristol', 51.49300, -2.61700),
  ('Stagecoach Performing Arts Bristol', 51.45200, -2.57190),
  ('babyballet Bradley Stoke, Thornbury & Portishead', 51.53000, -2.54700),
  ('Little Movers North Somerset & Bristol', 51.48150, -2.76700),
  ('Rock Out Baby Bristol', 51.45450, -2.57190),
  ('The Little Sensory Co, Central Bristol', 51.43750, -2.57700),
  ('Sharon Phillips School of Dancing', 51.52450, -2.56200),
  ('Stoke Gifford School of Dance', 51.51350, -2.54400)
) as v(name, lat, lng)
where lower(l.name) = lower(v.name) and l.lat is null;
