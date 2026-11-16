-- Bristol FREE: all listing batches 2-7 plus approximate pins (Nov 2026)
-- Safe to run whether or not you've run any of the individual files before:
-- existing listings (matched by name) are skipped, and pins are only added where missing.
begin;

-- ===== batches-02-03-soft-play-and-parties.sql =====
-- Batches 2 and 3: soft play, play cafes, party venues and entertainers (researched Nov 2026)
-- 32 listings. Loads as UNCLAIMED DRAFTS: nothing shows until you publish each one in admin.
-- Safe to run more than once: any listing whose name is already in the database is skipped.
-- After running, click 'Place missing map pins' in admin. Mobile entertainers have no address, so no pin.
-- Paste into Supabase > SQL Editor and click Run.
insert into public.listings (name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages, status, claimed, featured)
select v.name, v.category, v.area, v.description, v.address, v.postcode, v.website, v.phone, v.opening_hours, v.price_band, v.ages, 'draft', false, false
from (values
  -- source: inkl/Bristol Post; dayoutwiththekids (verified Dec 2024)
  ('Jump Bristol', 'play', 'North Bristol', 'One of the biggest soft play centres in the country, tucked behind Cribbs Causeway. Huge adventure frames, inflatables, an indoor football pitch and a big separate zone for toddlers. For children up to 12.', '22 Concorde Road, Patchway', 'BS34 5TB', 'https://www.123jump.co.uk', '0117 931 2733', null, 2, array['baby','toddler','kids']::text[]),
  -- source: visitwest.co.uk (2026 hours)
  ('AirHop Bristol', 'play', 'North Bristol', 'A giant trampoline park by The Mall at Cribbs Causeway: wall-to-wall trampolines, slides, an obstacle course, dodgeball and foam pits. MiniHopper sessions for 6 months to 6 years, with soft play. Standard jumping from age 4.', 'Unit 5, Britannia Road, Patchway Trading Estate', 'BS34 5TA', 'https://www.airhop-bristol.com', '0330 223 3333', 'Mon 10am to 7pm, Tue to Thu 3pm to 7pm, Fri 10am to 8pm, Sat 9am to 8pm, Sun 9am to 6pm (check holidays)', 3, array['toddler','kids','teen']::text[]),
  -- source: lovetovisit.com
  ('Ninja Warrior UK Bristol', 'play', 'North Bristol', 'An adventure park inspired by the TV show, with ninja courses for kids, teens and adults, plus a Mini Ninjas soft play upstairs for 0 to 3s next to the café. Free parking at Cribbs Causeway Retail Park.', 'Unit A, Cribbs Causeway Retail Park, Lysander Road, Patchway', 'BS34 5TX', 'https://ninjawarrioruk.co.uk/bristol/', null, null, 3, array['toddler','kids','teen']::text[]),
  -- source: mallcribbs.com; dayoutwiththekids
  ('Wild Things Play Project', 'play', 'North Bristol', 'A different take on soft play inside The Mall: wooden, shoes-on play equipment more like an adventure playground, with a treehouse frame, giant sandpit, crafts and a toddler area. For ages 7 and under.', 'Unit 209, Upper Level, The Mall, Cribbs Causeway', 'BS34 5DG', 'https://www.mallcribbs.com/stores/wild-things-play-project/', '0117 959 2514', null, 2, array['baby','toddler','kids']::text[]),
  -- source: lovetovisit.com; NHS service directory
  ('Freedog Bristol', 'play', 'South Bristol', 'Trampoline park and soft play a short walk from Temple Meads. Big trampoline court, foam pits, ninja lanes and interactive jump games, plus toddler sessions and a three-storey soft play.', '2A to C Templegate Park, Mead Street', 'BS3 4RP', 'https://www.freedogbristol.com', null, null, 3, array['toddler','kids','teen']::text[]),
  -- source: wheretogowithkids; food hygiene register
  ('Noah''s Ark Play Centre', 'play', 'South Bristol', 'A long-running Brislington soft play with a big multi-level frame, a dedicated toddler area and a café. Adults go free.', '828a Bath Road, Brislington', 'BS4 5LQ', 'https://www.noahsarkplay.com', '0117 971 2599', null, 2, array['baby','toddler','kids']::text[]),
  -- source: dayoutwiththekids
  ('PlaySpace', 'play', 'East Bristol', 'An indoor play and party centre with seven zones of slides, rope bridges, ball pools and lookouts, plus a café with proper food and coffee. For children up to 10.', '85 Barrow Road, St Philips', 'BS5 0AE', 'https://www.playspace.co.uk', '0117 955 0070', null, 2, array['baby','toddler','kids']::text[]),
  -- source: NHS service directory; holidayfox
  ('Cheeky Monkeys Soft Play', 'play', 'East Bristol', 'A friendly soft play in a church hall just off Lodge Causeway, with an inflatable jungle, ball pits, slides and a baby corner. Ideal for under-5s.', 'Argyle Morley Church, Whitefield Road, St George', 'BS5 7UB', 'https://www.cheeky-monkeys.org', null, null, 1, array['baby','toddler']::text[]),
  -- source: Bishopston Voice; Boing booking page
  ('Boing! Lockleaze', 'play', 'North Bristol', 'A community soft play and play café for 0 to 5s, now run by Lockleaze Neighbourhood Trust. Relaxed play sessions plus Tiddlers, a structured group with activities and a story.', 'The Hub, Gainsborough Square, Lockleaze', 'BS7 9FB', 'https://boingbristolcic.schedulista.com', null, null, 1, array['baby','toddler']::text[]),
  -- source: Knowle West community calendar; Charity Commission
  ('Boing! Inns Court', 'play', 'South Bristol', 'Affordable soft play for 0 to 5s at the Inns Court Community and Family Centre, with a community café serving low-cost food including kids'' platters.', 'Inns Court Community and Family Centre, 1 Marshall Walk, Knowle West', 'BS4 1TR', 'https://www.iccfc.co.uk/boinginnscourt', null, 'Term time Mon to Fri 9am to 4pm, Sat 9am to 6.15pm (check before you go)', 1, array['baby','toddler']::text[]),
  -- source: tigerplay.co.uk; wanderlog reviews
  ('Skyboat Cafe', 'cafes', 'North Bristol', 'A calm, design-led play café in Redland run by two local mums. Sensory room for babies, soft play and role play for under-7s, and a healthy, toddler-friendly menu.', '4 Harcourt Road, Redland', 'BS6 7RG', 'https://www.skyboatcafe.com', null, null, 1, array['baby','toddler','kids']::text[]),
  -- source: visitbristol.co.uk
  ('Out There Indoors Play Café', 'cafes', 'South Bristol', 'A Scandinavian-inspired play café at Paintworks: climbing walls, ball shoots, dress-up, loose-parts play and a cosy book corner, without the bright plastic of a typical soft play.', 'Zone C, Paintworks, Bath Road', 'BS4 3AR', null, null, null, 1, array['baby','toddler','kids']::text[]),
  -- source: greeneking.co.uk; dayoutwiththekids
  ('Wacky Warehouse at The Mill House', 'play', 'East Bristol', 'Soft play attached to a family pub in Emersons Green, with climbing, slides and swings, a toddler area and party room. Food and drink from the pub.', 'The Mill House, Emerson Way, Emersons Green', 'BS16 7AE', 'https://www.greeneking.co.uk/pubs/avon/mill-house/wacky-warehouse', '0117 970 2023', 'Mon to Thu and Sun 9am to 7pm, Fri and Sat 9am to 8pm', 1, array['toddler','kids']::text[]),
  -- source: activecentres.org
  ('Coral Cove Soft Play, Kingswood', 'play', 'East Bristol', 'A new, bigger soft play at Kingswood Active Lifestyle Centre with two levels of play and a toddler area. Book online through Active Centres.', 'Kingswood Active Lifestyle Centre, Church Road, Staple Hill', 'BS16 4RH', 'https://activecentres.org/coral-cove/', '0300 333 0300', null, 1, array['baby','toddler','kids']::text[]),
  -- source: activecentres.org; yateshoppingcentre.co.uk
  ('Jungle Kingdom Soft Play, Yate', 'play', 'Yate', 'A jungle-themed soft play at Yate Active Lifestyle Centre. Open sessions at weekends when it isn''t booked for parties.', 'Yate Active Lifestyle Centre, Kennedy Way', 'BS37 4DQ', 'https://activecentres.org/jungle-kingdom/', '0300 333 0300', 'Weekend sessions, check online booking', 1, array['toddler','kids']::text[]),
  -- source: NHS service directory
  ('The Play Shed', 'play', 'Yate', 'A family-run soft play and café in Yate with a new three-zone play frame.', 'Unit 4, Rainbow Court, Armstrong Way', 'BS37 5NG', null, null, null, 1, array['baby','toddler','kids']::text[]),
  -- source: inkl/Bristol Post; wanderlog
  ('Jaq''s Leisure', 'play', 'Yate', 'Family-run soft play inside Kemps Plants near Coalpit Heath, with a play frame for 5 to 12s, a soft zone for babies to 4s, an outdoor pirate play area and farm animals to meet.', 'Kemps Plants, Oakleigh Green Farm Lane, Westerleigh', 'BS37 8QZ', 'https://www.jaqsleisure.co.uk', null, null, 1, array['baby','toddler','kids']::text[]),
  -- source: activecentres.org
  ('PlayZone, Thornbury', 'play', 'Thornbury', 'Active play sessions for under-5s at Thornbury Active Lifestyle Centre, on Tuesday mornings and Thursday afternoons. Parents stay and play.', 'Thornbury Active Lifestyle Centre, Alveston Hill', 'BS35 3JB', 'https://activecentres.org/centres/thornbury', '0300 333 0300', 'Tue 9am to 12pm, Thu 12.30pm to 3.30pm (check before you go)', 1, array['toddler']::text[]),
  -- source: better.org.uk
  ('Soft Play at Keynsham Leisure Centre', 'play', 'Keynsham', 'Bookable soft play for children up to 8 at Better''s Keynsham Leisure Centre. You don''t need to be a member.', 'Keynsham Leisure Centre, Temple Street', 'BS31 1HE', 'https://www.better.org.uk/leisure-centre/banes/keynsham-leisure-centre/soft-play', null, null, 1, array['baby','toddler','kids']::text[]),
  -- source: inkl/Bristol Post; tripaligner
  ('Little Possets Soft Play', 'play', 'Portishead', 'A safe, welcoming soft play for pre-school children at Portishead Youth and Community Centre, alongside a family café.', 'Portishead Youth Centre, 1 Harbour Road', 'BS20 7DD', 'https://www.portisheadyouthcentre.co.uk', null, null, 1, array['baby','toddler']::text[]),
  -- source: tenpin.co.uk
  ('Tenpin Bristol', 'parties', 'Central Bristol', 'Bowling parties at Avonmeads with pizza on the lanes and unlimited squash, plus laser tag, arcade games and escape rooms under one roof. Party packages from around £14 a head.', 'Avonmeads Shopping Park, St Philips', 'BS2 0SP', 'https://tenpin.co.uk/our-locations/bristol', null, null, 3, array['kids','teen']::text[]),
  -- source: cabotcircus.co.uk (2026)
  ('King Pins Bristol', 'parties', 'Central Bristol', 'Bowling and games at Cabot Circus, right in the city centre.', 'Upper Ground, Cabot Circus', 'BS1 3BX', 'https://www.cabotcircus.co.uk/top-10-best-things-to-do-with-children-in-bristol', null, null, 3, array['kids','teen']::text[]),
  -- source: team-sport.co.uk; wheretogowithkids
  ('TeamSport Bristol Karting and Laser Combat', 'parties', 'North Bristol', 'Indoor go karting on a multi-level track for ages 8 and up, and Bristol''s biggest multi-level laser tag arena for ages 6 and up. Kids'' party packages, party rooms and a café on site.', 'Avonmouth Way, Avonmouth', 'BS11 9YA', 'https://www.team-sport.co.uk/bristol/', '0117 982 7562', null, 3, array['kids','teen']::text[]),
  -- source: wheretogowithkids; ukschooltrips; 365bristol
  ('Clip ''n Climb Bristol', 'parties', 'Central Bristol', 'Colourful themed climbing walls on auto-belays for ages 4 and up. Party packages include climbing, food and drink. Open Friday to Sunday plus school holidays.', 'Unit 3, New Gatton Road, St Werburghs', 'BS2 9SH', 'https://clipnclimbbristol.co.uk', '0117 955 8508', 'Fri to Sun, plus every day in school holidays', 3, array['kids','teen']::text[]),
  -- source: classforkids.io (2026 party listings)
  ('City of Bristol Gymnastics Centre parties', 'parties', 'South Bristol', 'Gymnastics parties with exclusive use of the gym hall for an hour, then time in a party room. Around £170 to £200 for up to 30 children.', 'City of Bristol Gymnastics Centre, Teyfant Road, Hartcliffe', 'BS13 0RF', 'https://city-of-bristol-gymnastics-club.classforkids.io', null, null, 1, array['kids']::text[]),
  -- source: kilnworkshop.com; eventbrite; happity
  ('Kiln Workshop', 'parties', 'North Bristol', 'An independent pottery painting studio just off Gloucester Road, with drop-in painting, kids'' parties, holiday workshops and art clubs.', '63 North Road, Bishopston', 'BS6 5AD', 'https://www.kilnworkshop.com', null, 'Thu to Sun 10am to 5.30pm', 2, array['toddler','kids','teen']::text[]),
  -- source: windmillhillcityfarm.org.uk
  ('Mini Potters', 'parties', 'South Bristol', 'A paint-your-own pottery shed at Windmill Hill City Farm. Weekday painting sessions by booking, weekend parties, and baby hand and footprints onto pottery.', 'Windmill Hill City Farm, Philip Street, Bedminster', 'BS3 4EA', 'https://windmillhillcityfarm.org.uk/?p=3333', null, 'Mon to Fri 9.30am to 2.30pm by booking; parties at weekends', 2, array['baby','toddler','kids']::text[]),
  -- source: skiddle.com (Aug to Dec 2026)
  ('Glazed and Confused Pottery Painting', 'parties', 'South Bristol', 'Pop-up pottery painting every other Sunday at Windmill Hill City Farm, plus private parties and events. They glaze and fire your piece for you.', 'Barn Terrace, Windmill Hill City Farm, Philip Street, Bedminster', 'BS3 4EA', 'https://glazedconfused.com', null, 'Pop-ups every other Sunday 10am to 4pm', 2, array['kids','teen']::text[]),
  -- source: thebestof.co.uk; freeindex
  ('Johnny G Children''s Entertainer', 'parties', 'Keynsham', 'Children''s entertainer and kids'' magician covering Bristol, Bath and nearby towns, with puppet and magic shows, discos, balloon modelling and circus skills. Mobile: comes to your venue.', null, null, null, null, null, 3, array['toddler','kids']::text[]),
  -- source: thebathandwiltshireparent; freeindex
  ('The Great Jaydini', 'parties', 'East Bristol', 'Comedy children''s magician with a mini disco, party games and balloon fun, working across Bristol, Bath and Wiltshire. Member of the Bristol Society of Magic. Mobile: comes to your venue.', null, null, null, null, null, 3, array['toddler','kids']::text[]),
  -- source: freeindex; trustpilot (2025)
  ('Lucy Lost-it', 'parties', 'Central Bristol', 'A fun, friendly female children''s entertainer based in Bristol, with magic, puppetry, balloon modelling and circus skills. Mobile: comes to your venue.', null, null, 'https://lucylost-it.co.uk', null, null, 3, array['toddler','kids']::text[]),
  -- source: themagiccircle.co.uk; freeindex (2025)
  ('Chris P Tee Magician', 'parties', 'Yate', 'Magic Circle comedy magician and children''s entertainer based near Chipping Sodbury, with magic shows, mini discos and Punch and Judy. Mobile: comes to your venue.', null, null, 'https://themagiccircle.co.uk/find-a-magician/profile/chrisptee', null, null, 3, array['toddler','kids']::text[])
) as v(name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages)
where not exists (select 1 from public.listings l where lower(l.name) = lower(v.name));

-- ===== batch-04-classes.sql =====
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

-- ===== batch-05-family-hubs-and-music.sql =====
-- Batch 5: South Bristol Best Start Family Hub children's centres, and The Jolly Melodies Music Company (Nov 2026)
-- 8 listings. Loads as UNCLAIMED DRAFTS: nothing shows until you publish each one in admin.
-- Safe to run more than once: any listing whose name is already in the database is skipped.
-- After running, click 'Place missing map pins' in admin. Mobile entertainers have no address, so no pin.
-- Paste into Supabase > SQL Editor and click Run.
insert into public.listings (name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages, status, claimed, featured)
select v.name, v.category, v.area, v.description, v.address, v.postcode, v.website, v.phone, v.opening_hours, v.price_band, v.ages, 'draft', v.claimed, false
from (values
  -- source: Bristol Early Years; happity.co.uk; Bristol City Council
  ('Bedminster Children''s Centre', 'childcare', 'South Bristol', 'Part of Bristol''s Best Start Family Hubs (South), formerly South Bristol Children''s Centres. Free groups and sessions for 0 to 5s and their parents and carers, such as baby groups and toddler sessions, plus one-to-one family support. Register with the hub to join in.', 'British Road, Bedminster (next to Compass Point school)', 'BS3 3BZ', 'https://www.bristol.gov.uk/bristol-family-hubs/your-family-hubs/south-family-hub', '0117 374 6362', null, 0, array['baby','toddler']::text[], true),
  -- source: Bristol Early Years; happity.co.uk; Well Aware
  ('Bishopsworth Children''s Centre', 'childcare', 'South Bristol', 'Part of Bristol''s Best Start Family Hubs (South), formerly South Bristol Children''s Centres. Free groups and sessions for 0 to 5s and their parents and carers, such as baby groups and toddler sessions, plus one-to-one family support. Register with the hub to join in.', '2 Lakemead Grove, Bishopsworth', 'BS13 8EA', 'https://www.bristol.gov.uk/bristol-family-hubs/your-family-hubs/south-family-hub', '0117 978 1028', null, 0, array['baby','toddler']::text[], true),
  -- source: get-information-schools.service.gov.uk (2025); Bristol City Council
  ('Hartcliffe Children''s Centre', 'childcare', 'South Bristol', 'Part of Bristol''s Best Start Family Hubs (South), formerly South Bristol Children''s Centres. Free groups and sessions for 0 to 5s and their parents and carers, such as baby groups and toddler sessions, plus one-to-one family support. Register with the hub to join in. The South Family Hub navigators are usually based here.', 'Hareclive Road, Hartcliffe', 'BS13 0JW', 'https://www.bristol.gov.uk/bristol-family-hubs/your-family-hubs/south-family-hub', '0117 903 8633', null, 0, array['baby','toddler']::text[], true),
  -- source: happity.co.uk; Well Aware
  ('Knowle West Children''s Centre (Inns Court)', 'childcare', 'South Bristol', 'Part of Bristol''s Best Start Family Hubs (South), formerly South Bristol Children''s Centres. Free groups and sessions for 0 to 5s and their parents and carers, such as baby groups and toddler sessions, plus one-to-one family support. Register with the hub to join in.', 'Inns Court, Knowle West', 'BS4 1TR', 'https://www.bristol.gov.uk/bristol-family-hubs/your-family-hubs/south-family-hub', '0117 353 2036', null, 0, array['baby','toddler']::text[], true),
  -- source: Ofsted / get-information-schools; happity.co.uk
  ('Stockwood Children''s Centre', 'childcare', 'South Bristol', 'Part of Bristol''s Best Start Family Hubs (South), formerly South Bristol Children''s Centres. Free groups and sessions for 0 to 5s and their parents and carers, such as baby groups and toddler sessions, plus one-to-one family support. Register with the hub to join in.', 'Whittock Road, Stockwood', 'BS14 8DQ', 'https://www.bristol.gov.uk/bristol-family-hubs/your-family-hubs/south-family-hub', '0117 353 3503', null, 0, array['baby','toddler']::text[], true),
  -- source: get-information-schools.service.gov.uk; NHS directory
  ('Redcliffe Children''s Centre', 'childcare', 'Central Bristol', 'Part of Bristol''s Best Start Family Hubs (South), formerly South Bristol Children''s Centres. Free groups and sessions for 0 to 5s and their parents and carers, such as baby groups and toddler sessions, plus one-to-one family support. Register with the hub to join in.', 'Spencer House, Ship Lane, Redcliffe', 'BS1 6RR', 'https://www.bristol.gov.uk/bristol-family-hubs/your-family-hubs/south-family-hub', null, null, 0, array['baby','toddler']::text[], true),
  -- source: happity.co.uk (Nov 2026 classes); MNR Journal
  ('The Jolly Melodies Music Company, Bristol', 'classes', 'North Bristol', 'Lively music and percussion classes for babies, toddlers and pre-schoolers with their grown-up (formerly Music With Mummy and Jolly Babies). Bristol classes include Horfield Quaker Meeting on Gloucester Road and Shirehampton Public Hall.', null, null, 'https://thejollymelodiesmusiccompany.co.uk/', null, 'Term time, weekday mornings', 2, array['baby','toddler']::text[], false),
  -- source: happity.co.uk; classforkids.io
  ('The Jolly Melodies Music Company, Yate', 'classes', 'Yate', 'Fun, educational music classes for babies and toddlers with their grown-up (formerly Music With Mummy). Jolly Toddlers on Friday mornings for 16 months to 4 years, about £6 a class.', 'Yate Methodist Church, 6b Moorland Road', 'BS37 4BZ', 'https://the-jolly-melodies-music-company-katie.classforkids.io', null, 'Fridays 9.15am to 9.45am, term time', 2, array['baby','toddler']::text[], false)
) as v(name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages, claimed)
where not exists (select 1 from public.listings l where lower(l.name) = lower(v.name));

-- ===== batch-06-martial-arts.sql =====
-- Batch 6: Red Dragons Martial Arts (4 venues) and 2010 Taekwondo Club (Nov 2026)
-- 5 listings. Loads as UNCLAIMED DRAFTS: nothing shows until you publish each one in admin.
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
  ('Red Dragons Martial Arts, Pill', 'sport', 'Portishead', 'Martial arts classes for children aged 4 and up, building confidence, discipline, balance and coordination. Led by Lloyd Lewis, a two-time world kickboxing champion. Free trial class available.', 'Pill Community Centre, Church Place, Pill', 'BS20 0AE', 'https://www.reddragonsmartialarts.com/', null, null, 2, array['kids']::text[], false),
  -- source: Richard (checked Nov 2026); club website
  ('2010 Taekwondo Club', 'sport', 'South Bristol', 'Traditional taekwondo for children and adults, led by instructor Matt Stein. Mixed-age classes from age 5 upwards, with children and adults training alongside each other. About £8.50 a session.', 'Redcatch Community Centre, Redcatch Road, Knowle', 'BS4 2EP', 'https://sites.google.com/site/2010taekwondoclub/', null, 'Mondays 5.45pm to 6.45pm, term time', 2, array['kids','teen']::text[], false)
) as v(name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages, claimed)
where not exists (select 1 from public.listings l where lower(l.name) = lower(v.name));

-- ===== batch-07-checklist.sql =====
-- Batch 7: places from the checklist marked Open (Nov 2026)
-- 23 listings. Loads as UNCLAIMED DRAFTS: nothing shows until you publish each one in admin.
-- Safe to run more than once: any listing whose name is already in the database is skipped.
-- After running, click 'Place missing map pins' in admin. Mobile entertainers have no address, so no pin.
-- Paste into Supabase > SQL Editor and click Run.
insert into public.listings (name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages, status, claimed, featured)
select v.name, v.category, v.area, v.description, v.address, v.postcode, v.website, v.phone, v.opening_hours, v.price_band, v.ages, 'draft', v.claimed, false
from (values
  -- source: greeneking.co.uk; dayoutwiththekids (2025)
  ('Wacky Warehouse at the Wishing Well', 'play', 'East Bristol', 'Pub soft play in Kingswood with slides, climbing and swings, open after school, weekends, holidays and bank holidays. Parties with a host, plus food and drink from the pub.', 'Aspects Leisure Park, Kingswood', 'BS15 9LA', 'https://www.greeneking.co.uk/pubs/avon/wishing-well/wacky-warehouse', null, null, 1, array['toddler','kids']::text[], false),
  -- source: CAMRA; Bristol 24/7; Bristol Post
  ('The Eastfield Inn play café', 'cafes', 'North Bristol', 'An award-winning family pub in Henleaze with an indoor play café, a family room and a big garden with a fenced climbing frame. Food all day and plenty of space for buggies.', '219 Henleaze Road, Henleaze', 'BS9 4NQ', 'https://www.theeastfieldinn.co.uk', '0117 379 0979', null, 1, array['baby','toddler','kids']::text[], false),
  -- source: activecentres.org; Bristol 24/7
  ('Explore Adventure Play, Bradley Stoke', 'play', 'Bradley Stoke', 'Three floors of soft play at Bradley Stoke Active Lifestyle Centre, with its own area for babies and toddlers and a café for grown-ups. For ages 0 to 9.', 'Bradley Stoke Active Lifestyle Centre, Fiddlers Wood Lane', 'BS32 9BS', 'https://activecentres.org/facilities/children/softplay/', '0300 333 0300', 'Mon to Fri 9am to 7pm (check weekends)', 1, array['baby','toddler','kids']::text[], false),
  -- source: FreeIndex (verified Sep 2025)
  ('Kids Zone Disco', 'parties', 'East Bristol', 'Specialist children''s party discos for ages 3 to 11, with music and party games pitched at the age group. Running since 2001, based in Hanham. Mobile: comes to your venue.', null, null, 'https://www.freeindex.co.uk/profile(kids-zone-disco)_174831.htm', null, null, 3, array['toddler','kids']::text[], false),
  -- source: Eventsense; Bristol Harbour Festival
  ('Marky Jay', 'parties', 'Central Bristol', 'Juggler and children''s entertainer: the Marky Jay Monkey Magic Show followed by a circus skills workshop where everyone has a go. Regular at Bristol Harbour Festival. Mobile: comes to your venue.', null, null, 'https://www.eventsense.co.uk/listing/marky-jay', null, null, 3, array['kids']::text[], false),
  -- source: Visit Weston; Visit Bath (2026)
  ('Mendip Activity Centre', 'parties', 'Nailsea', 'Adventure centre in the Mendip Hills with a dry ski slope, all-weather toboggan run, archery, Nerf battles and more. Party packages for all ages, holiday day camps and summer adventure camps for 8 to 15s.', 'Lyncombe Drive, Sandford, Churchill', 'BS25 5PQ', 'https://www.mendip.co.uk', '01934 834877', null, 3, array['kids','teen']::text[], false),
  -- source: Richard (checked Nov 2026); happity; NHS directory
  ('Jo Jingles Bristol', 'classes', 'Bradley Stoke', 'Music, singing and movement classes for babies, toddlers and pre-schoolers from 3 months to 5 years, around Bradley Stoke, Emersons Green and Thornbury.', null, null, 'https://www.happity.co.uk/jo-jingles/bristol', null, null, 2, array['baby','toddler']::text[], false),
  -- source: Richard (checked Nov 2026); NHS directory
  ('TinyTalk Baby Signing Bristol', 'classes', 'North Bristol', 'Baby signing and toddler talking classes using songs, props and play to learn British Sign Language signs. Venues have included Westbury-on-Trym Village Hall and Horfield.', null, null, 'https://www.tinytalk.co.uk', null, null, 2, array['baby','toddler']::text[], false),
  -- source: Richard (checked Nov 2026); Stagecoach; Bath Echo
  ('Stagecoach Performing Arts Bristol', 'classes', 'Central Bristol', 'Weekend singing, dancing and acting classes, with Mini Stages for 2 to 4s with a grown-up and main classes up to 18. Schools around Bristol including Long Ashton and Keynsham.', null, null, 'https://www.stagecoach.co.uk', null, 'Weekends, term time', 3, array['toddler','kids','teen']::text[], false),
  -- source: Richard (checked Nov 2026); happity; Bradley Stoke Journal
  ('babyballet Bradley Stoke, Thornbury & Portishead', 'classes', 'Bradley Stoke', 'Pre-school dance from 6 months to 6 years, from Tinies with a grown-up to Groovers and Tappers. Classes at Baileys Court Activity Centre, Portishead Youth Centre and around Thornbury.', null, null, 'https://babyballet.co.uk', '07395 805885', 'Term time', 2, array['baby','toddler','kids']::text[], false),
  -- source: Richard (checked Nov 2026); happity
  ('Little Movers North Somerset & Bristol', 'classes', 'Portishead', 'Award-winning dance and movement classes from birth to 5: Baby Movers for non-crawlers and Little Movers for walkers. Venues include Pill, Portishead, Clevedon, Nailsea and Redland. About £7 a class.', null, null, 'https://www.happity.co.uk/little-movers/north-somerset-bristol', null, 'Term time', 2, array['baby','toddler']::text[], false),
  -- source: Richard (checked Nov 2026); happity
  ('Balasana Bristol', 'classes', 'Central Bristol', 'Calm, bonding baby classes: baby massage, mum and baby yoga, guided meditation and sensory play for babies from 1 to 9 months. About £10 a class.', 'The Barre Fitness Studio, 171 Whiteladies Road', 'BS8 2RY', null, null, null, 3, array['baby']::text[], false),
  -- source: Richard (checked Nov 2026); happity
  ('Rock Out Baby Bristol', 'classes', 'Central Bristol', 'Live music classes for babies and toddlers, led by working musicians playing rock and roll covers alongside nursery rhymes. Venues include Knowle, Horfield Common, Windmill Hill City Farm and Fishponds. About £8 a class.', null, null, 'https://beta1.happity.co.uk/rock-out-baby/bristol', null, 'Term time', 2, array['baby','toddler']::text[], false),
  -- source: Richard (checked Nov 2026); happity
  ('The Little Sensory Co, Central Bristol', 'classes', 'Central Bristol', 'Little Glow sensory rooms for babies up to 15 months, and Little Mess themed messy play for 6 months to 5 years. Venues include Totterdown, Cadbury Heath and Speedwell. About £6.50 a session.', null, null, 'https://centralbristol.thelittlesensory.co/little-glow/', null, 'Term time', 2, array['baby','toddler']::text[], false),
  -- source: Richard (checked Nov 2026); happity; cademy
  ('Gymboree Play & Music Bristol', 'classes', 'North Bristol', 'Play-based classes for 0 to 5s on a purpose-built play floor: baby sensory and music, baby massage, and Play & Learn classes for crawlers to pre-schoolers. Monthly memberships, open gym sessions and parties.', '38 Eastfield, Westbury-on-Trym', 'BS9 4BE', 'https://www.gymboreeclasses.co.uk/franchisees/bristol/', null, null, 3, array['baby','toddler']::text[], false),
  -- source: Richard (checked Nov 2026); danceworks.uk.com
  ('Danceworks Bristol', 'classes', 'Bradley Stoke', 'Street and hip-hop, modern, jazz, contemporary and cheer dance for children, with classes in Bradley Stoke, Filton and Patchway. Pupils perform at local festivals.', 'Holy Trinity Church, Broad Croft, Bradley Stoke', 'BS32 0BD', 'https://danceworks.uk.com', '07871 436600', null, 2, array['kids','teen']::text[], false),
  -- source: Richard (checked Nov 2026); Bradley Stoke Journal; Hoop
  ('O''Malley School of Irish Dance', 'classes', 'Bradley Stoke', 'Irish dance for boys and girls from age 4, from beginners to World Championship level, plus adult classes. Classes at Bradley Stoke Community School and Abbeywood, Stoke Gifford.', 'Bradley Stoke Community School, Fiddlers Wood Lane', 'BS32 9BS', null, '07934 444877', null, 2, array['kids','teen']::text[], false),
  -- source: Richard (checked Nov 2026); Bradley Stoke Journal; ISTD
  ('Sharon Phillips School of Dancing', 'classes', 'North Bristol', 'ISTD tap, modern, ballet, acro, contemporary and commercial dance from 18 months to 18. Classes at St Chad''s Church Hall in Patchway and in Alveston.', 'St Chad''s Church Hall, Patchway', null, 'https://sharonphillipsdance.co.uk', '07989 652780', null, 2, array['toddler','kids','teen']::text[], false),
  -- source: Richard (checked Nov 2026); NHS directory; Stoke Gifford Journal
  ('Wingfield School of Dance', 'classes', 'Bradley Stoke', 'Long-established North Bristol dance school: RAD ballet, ISTD tap and modern, musical theatre, street dance and acrobatic arts. Classes in Little Stoke, Bradley Stoke and Winterbourne.', 'Little Stoke Community Hall, Little Stoke Lane', 'BS34 6HR', null, '07950 637900', null, 2, array['toddler','kids','teen']::text[], false),
  -- source: Richard (checked Nov 2026); Stoke Gifford Journal
  ('Stoke Gifford School of Dance', 'classes', 'North Bristol', 'Ballet, modern and tap from age 3, with Royal Academy of Dance exams. Teaching in Stoke Gifford since 1989.', 'Trust Hall and Poplar Rooms, North Road, Stoke Gifford', null, 'https://www.stokegifforddance.co.uk', '0117 960 5844', null, 2, array['toddler','kids','teen']::text[], false),
  -- source: Richard (checked Nov 2026); Hoop; NHS directory
  ('Bristol Karate Club', 'sport', 'South Bristol', 'A friendly, non-profit Wado Ryu karate club in Totterdown, with students from complete beginners to international level. Children can start at age 5.', 'Holy Nativity Church Hall, School Road, Totterdown', 'BS4 3BB', null, null, null, 2, array['kids','teen']::text[], false),
  -- source: Richard (checked Nov 2026); Bristol Online
  ('Concept Martial Arts', 'sport', 'South Bristol', 'A family-focused martial arts club for children in Bower Ashton, building confidence, fitness, wellbeing and character.', 'Bower Ashton', 'BS3 2JT', null, null, null, 2, array['kids']::text[], false),
  -- source: Richard (checked Nov 2026); dojos.co.uk; cademy
  ('Kyoto Shotokan Karate Club', 'sport', 'North Bristol', 'Traditional Shotokan karate for children, men and women, where families can train together. Affiliated to SKI-GB, covering Shirehampton, Avonmouth, Sea Mills, Henbury and Westbury-on-Trym.', 'Avonmouth Old Boys Rugby Club, Barracks Lane, Shirehampton', 'BS11 9NG', null, null, null, 2, array['kids','teen']::text[], false)
) as v(name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages, claimed)
where not exists (select 1 from public.listings l where lower(l.name) = lower(v.name));

-- ===== update-04-approx-pins.sql =====
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

commit;
