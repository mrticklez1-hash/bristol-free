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
