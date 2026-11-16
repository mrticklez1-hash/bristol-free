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
