-- Batch 3: party venues and children's entertainers (researched Nov 2026).
-- Loads as UNCLAIMED DRAFTS: nothing shows until you publish each one in admin.
-- Map pins: after running, click 'Place missing map pins' in admin. Mobile entertainers have no address, so no pin.
-- Paste into Supabase > SQL Editor and click Run.
insert into public.listings (name, category, area, description, address, postcode, website, phone, opening_hours, price_band, ages, status, claimed, featured) values
-- source: tenpin.co.uk
('Tenpin Bristol', 'parties', 'Central Bristol', 'Bowling parties at Avonmeads with pizza on the lanes and unlimited squash, plus laser tag, arcade games and escape rooms under one roof. Party packages from around £14 a head.', 'Avonmeads Shopping Park, St Philips', 'BS2 0SP', 'https://tenpin.co.uk/our-locations/bristol', null, null, 3, array['kids','teen']::text[], 'draft', false, false),
-- source: cabotcircus.co.uk (2026)
('King Pins Bristol', 'parties', 'Central Bristol', 'Bowling and games at Cabot Circus, right in the city centre.', 'Upper Ground, Cabot Circus', 'BS1 3BX', 'https://www.cabotcircus.co.uk/top-10-best-things-to-do-with-children-in-bristol', null, null, 3, array['kids','teen']::text[], 'draft', false, false),
-- source: team-sport.co.uk; wheretogowithkids
('TeamSport Bristol Karting and Laser Combat', 'parties', 'North Bristol', 'Indoor go karting on a multi-level track for ages 8 and up, and Bristol''s biggest multi-level laser tag arena for ages 6 and up. Kids'' party packages, party rooms and a café on site.', 'Avonmouth Way, Avonmouth', 'BS11 9YA', 'https://www.team-sport.co.uk/bristol/', '0117 982 7562', null, 3, array['kids','teen']::text[], 'draft', false, false),
-- source: wheretogowithkids; ukschooltrips; 365bristol
('Clip ''n Climb Bristol', 'parties', 'Central Bristol', 'Colourful themed climbing walls on auto-belays for ages 4 and up. Party packages include climbing, food and drink. Open Friday to Sunday plus school holidays.', 'Unit 3, New Gatton Road, St Werburghs', 'BS2 9SH', 'https://clipnclimbbristol.co.uk', '0117 955 8508', 'Fri to Sun, plus every day in school holidays', 3, array['kids','teen']::text[], 'draft', false, false),
-- source: classforkids.io (2026 party listings)
('City of Bristol Gymnastics Centre parties', 'parties', 'South Bristol', 'Gymnastics parties with exclusive use of the gym hall for an hour, then time in a party room. Around £170 to £200 for up to 30 children.', 'City of Bristol Gymnastics Centre, Teyfant Road, Hartcliffe', 'BS13 0RF', 'https://city-of-bristol-gymnastics-club.classforkids.io', null, null, 1, array['kids']::text[], 'draft', false, false),
-- source: kilnworkshop.com; eventbrite; happity
('Kiln Workshop', 'parties', 'North Bristol', 'An independent pottery painting studio just off Gloucester Road, with drop-in painting, kids'' parties, holiday workshops and art clubs.', '63 North Road, Bishopston', 'BS6 5AD', 'https://www.kilnworkshop.com', null, 'Thu to Sun 10am to 5.30pm', 2, array['toddler','kids','teen']::text[], 'draft', false, false),
-- source: windmillhillcityfarm.org.uk
('Mini Potters', 'parties', 'South Bristol', 'A paint-your-own pottery shed at Windmill Hill City Farm. Weekday painting sessions by booking, weekend parties, and baby hand and footprints onto pottery.', 'Windmill Hill City Farm, Philip Street, Bedminster', 'BS3 4EA', 'https://windmillhillcityfarm.org.uk/?p=3333', null, 'Mon to Fri 9.30am to 2.30pm by booking; parties at weekends', 2, array['baby','toddler','kids']::text[], 'draft', false, false),
-- source: skiddle.com (Aug to Dec 2026)
('Glazed and Confused Pottery Painting', 'parties', 'South Bristol', 'Pop-up pottery painting every other Sunday at Windmill Hill City Farm, plus private parties and events. They glaze and fire your piece for you.', 'Barn Terrace, Windmill Hill City Farm, Philip Street, Bedminster', 'BS3 4EA', 'https://glazedconfused.com', null, 'Pop-ups every other Sunday 10am to 4pm', 2, array['kids','teen']::text[], 'draft', false, false),
-- source: thebestof.co.uk; freeindex
('Johnny G Children''s Entertainer', 'parties', 'Keynsham', 'Children''s entertainer and kids'' magician covering Bristol, Bath and nearby towns, with puppet and magic shows, discos, balloon modelling and circus skills. Mobile: comes to your venue.', null, null, null, null, null, 3, array['toddler','kids']::text[], 'draft', false, false),
-- source: thebathandwiltshireparent; freeindex
('The Great Jaydini', 'parties', 'East Bristol', 'Comedy children''s magician with a mini disco, party games and balloon fun, working across Bristol, Bath and Wiltshire. Member of the Bristol Society of Magic. Mobile: comes to your venue.', null, null, null, null, null, 3, array['toddler','kids']::text[], 'draft', false, false),
-- source: freeindex; trustpilot (2025)
('Lucy Lost-it', 'parties', 'Central Bristol', 'A fun, friendly female children''s entertainer based in Bristol, with magic, puppetry, balloon modelling and circus skills. Mobile: comes to your venue.', null, null, 'https://lucylost-it.co.uk', null, null, 3, array['toddler','kids']::text[], 'draft', false, false),
-- source: themagiccircle.co.uk; freeindex (2025)
('Chris P Tee Magician', 'parties', 'Yate', 'Magic Circle comedy magician and children''s entertainer based near Chipping Sodbury, with magic shows, mini discos and Punch and Judy. Mobile: comes to your venue.', null, null, 'https://themagiccircle.co.uk/find-a-magician/profile/chrisptee', null, null, 3, array['toddler','kids']::text[], 'draft', false, false);
