-- Batch 4: classes, clubs, swimming, sport and forest schools (researched Nov 2026)
-- 18 listings. Loads as UNCLAIMED DRAFTS: nothing shows until you publish each one in admin.
-- Safe to run more than once: any listing whose name is already in the database is skipped.
-- After running, click 'Place missing map pins' in admin. Mobile entertainers have no address, so no pin.
-- Paste into Supabase > SQL Editor and click Run.
insert into public.listings (name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages, status, claimed, featured)
select v.name, v.category, v.area, v.description, v.address, v.postcode, v.website, v.phone, v.opening_hours, v.price_band, v.ages, 'draft', false, false
from (values
  -- source: happity.co.uk (Feb 2026 timetable)
  ('Baby Sensory Bristol North', 'classes', 'North Bristol', 'Award-winning sensory classes for babies from birth to 13 months, with a new theme every week: light shows, bubbles, puppets, signing and songs. Term-time classes in St Andrews, Bishopston and Bradley Stoke.', null, null, 'https://www.happity.co.uk/baby-sensory/baby-sensory-bristol-north', null, 'Term time, weekday mornings', 2, array['baby']::text[]),
  -- source: happity.co.uk; cademy
  ('Baby Sensory Bristol South', 'classes', 'South Bristol', 'Multi-sensory baby classes from birth to 13 months, including music, signing, light shows and baby yoga. Venues include Headley Park, the Southville Centre, Imperial Sports Ground and Saltford.', null, null, 'https://happity.co.uk/baby-sensory/bristol-south', null, null, 2, array['baby']::text[]),
  -- source: happity.co.uk
  ('Baby Sensory Bristol East', 'classes', 'East Bristol', 'Baby development classes from birth to 13 months at Lyde Green, Emersons Green and Kingswood community centres.', null, null, 'https://beta1.happity.co.uk/baby-sensory/bristol-east', null, null, 2, array['baby']::text[]),
  -- source: happity.co.uk; babyballet.co.uk
  ('babyballet Bristol', 'classes', 'Central Bristol', 'Pre-school dance from 6 months to 6 years, from Tinies with a grown-up through to Groovers for school starters. Classes across Bristol including Westbury, Southville, Kingswood, Withywood and Keynsham. Three-week trial available.', null, null, 'https://babyballet.co.uk/babyballet-school/bristol/', null, 'Term time', 2, array['baby','toddler','kids']::text[]),
  -- source: perform.org.uk
  ('Perform Bristol', 'classes', 'Central Bristol', 'Drama, dance and singing for 4 to 12s, with a focus on confidence and social skills. Weekly classes in Redland, Henleaze, Bedminster, Brislington and Longwell Green. Free trial class.', null, null, 'https://www.perform.org.uk/free-drama-class/bristol', null, 'After school and Saturdays', 2, array['kids']::text[]),
  -- source: pqacademy.com; happity.co.uk
  ('Pauline Quirke Academy Bristol', 'classes', 'Central Bristol', 'Weekend performing arts school for ages 4 to 18: musical theatre, comedy and drama, and film and TV, with Poppets classes for 4 and 5 year olds. Free taster session.', 'Cotham School, Cotham Lawn Road', 'BS6 6DT', 'https://www.pqacademy.com/bristol-drama-classes-kids/', null, 'Fridays and Saturdays', 3, array['kids','teen']::text[]),
  -- source: childrens-scrapstore site; Bristol Local Offer; Charity Commission
  ('Children''s Scrapstore', 'classes', 'Central Bristol', 'A Bristol charity turning business waste into art and play materials. Free monthly Super Saturday craft sessions for families, holiday stay and play, after-school art club and an art shop.', 'Scrapstore House, 21 Sevier Street, St Werburghs', 'BS2 9LB', 'https://www.childrensscrapstore.co.uk', '0117 304 1781', null, 1, array['toddler','kids','teen']::text[]),
  -- source: littlekickers.co.uk venue pages
  ('Little Kickers Bristol', 'sport', 'North Bristol', 'Pre-school football for boys and girls from 18 months to 5 years, learning through play. Term-time classes at Westbury-on-Trym Academy, Stoke Bishop Village Hall, Abbeywood and Ashton.', null, null, 'https://www.littlekickers.co.uk', null, 'Term time', 2, array['toddler']::text[]),
  -- source: rugbytots.co.uk (autumn 2026 classes)
  ('Rugbytots Bristol & Bath', 'sport', 'Central Bristol', 'Rugby play sessions for 2 to 5 year olds: toddlers take part with a grown-up, older ones go solo. Classes at Ashton Park, Westbury-on-Trym, St George, Clifton and Winterbourne. Around £9 a session.', null, null, 'https://www.rugbytots.co.uk', '0345 313 6708', 'Weekends', 2, array['toddler']::text[]),
  -- source: hoop.co.uk; happity.co.uk; trustpilot (2026)
  ('Water Babies Bristol & Bath', 'sport', 'North Bristol', 'Baby and toddler swimming lessons from birth, plus Swimvincible lessons for primary-age children. Pools in Henbury, Abbots Leigh, Filton, Hartcliffe, Brislington, Clevedon, Wraxall and Thornbury. About £19.50 a lesson.', null, null, 'https://www.waterbabies.co.uk', '0117 946 6919', null, 3, array['baby','toddler','kids']::text[]),
  -- source: Bishopston Voice
  ('Everyone Active swimming lessons', 'sport', 'Central Bristol', 'Children''s swimming lessons at Bristol City Council''s leisure centres: Horfield, Easton, Henbury and Bristol South Pool. Specialist lessons for children with disabilities with the charity Level Water.', null, null, 'https://www.everyoneactive.com', null, null, 2, array['toddler','kids','teen']::text[]),
  -- source: bristolkarateacademy.com
  ('Bristol Karate Academy', 'sport', 'Central Bristol', 'Traditional karate clubs across Bristol and North Somerset. Children''s classes from age 7, plus 12-week introductory courses for 5 to 7s.', null, null, 'https://www.bristolkarateacademy.com', null, null, 2, array['kids','teen']::text[]),
  -- source: dojos.co.uk; poyst
  ('City Gongfu KIDS', 'sport', 'Central Bristol', 'Kung fu classes for children in Clifton and Long Ashton, run by a qualified primary school teacher. Parent and child sessions too.', 'The Exercise Club, 213 Whiteladies Road, Clifton', 'BS8 2XS', null, null, null, 2, array['kids']::text[]),
  -- source: artemisbjj.com
  ('Artemis BJJ Kids', 'sport', 'East Bristol', 'Friendly, affordable kids'' Brazilian jiu jitsu on Sunday mornings, just off the Lawrence Hill roundabout.', null, null, 'https://www.artemisbjj.com/kids/', null, 'Sundays 10.30am to 11.45am', 2, array['kids']::text[]),
  -- source: classforkids.io (autumn 2026 terms)
  ('Kingfishers Forest School', 'outdoors', 'East Bristol', 'Parent and child forest school for 1 to 5 year olds in private woods at Willsbridge Mill: mud kitchen, bug hunts, crafts, stories and snacks round the fire. Babies under 1 go free.', 'Willsbridge Mill, Long Beach Road, Willsbridge', 'BS30 6EU', 'https://kingfishers-forest-school.classforkids.io', null, 'Term time, weekday mornings', 2, array['baby','toddler']::text[]),
  -- source: classforkids.io (2025 to 2026)
  ('Mud Pie Explorers', 'outdoors', 'East Bristol', 'Child-led forest school in Downend: tree climbing, fire lighting, tool work, rope work and campfire cooking. Groups include a Saturday session for 10 to 16s.', 'Lincombe Barn Woods, Downend', 'BS16 2RW', 'https://mud-pie-explorers.classforkids.io', null, 'Term time', 3, array['kids','teen']::text[]),
  -- source: happity.co.uk
  ('Branches Out Forest School', 'outdoors', 'South Bristol', 'Forest school stay and play for walking toddlers up to pre-school: mud kitchen, bug hunting, crafts, campfire snacks and songs. About £8.50 a session, with subsidised places for eligible families.', 'Off Crosscombe Drive, Hartcliffe', 'BS13 0BZ', null, null, 'Tuesdays 9.15am to 10.30am, term time', 2, array['toddler']::text[]),
  -- source: happity.co.uk
  ('Back2Basics Forest School', 'outdoors', 'North Bristol', 'Saturday forest school for ages 4 and up at Lawrence Weston Community Farm: whittling, campfire cooking, tree climbing and den building. About £16 a session.', 'Lawrence Weston Community Farm, Saltmarsh Drive', 'BS11 0NJ', null, null, 'Saturdays 10am to 12pm', 3, array['kids']::text[])
) as v(name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages)
where not exists (select 1 from public.listings l where lower(l.name) = lower(v.name));
