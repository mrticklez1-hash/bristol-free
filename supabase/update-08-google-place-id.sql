-- Update 8: optional Google place ID on listings (Nov 2026)
-- Makes each listing's "Google reviews" link open exactly the right place.
-- Without it, the link searches Google Maps for the name and postcode instead.
-- Safe to run more than once. Paste into Supabase > SQL Editor and click Run.
alter table public.listings add column if not exists google_place_id text
  check (google_place_id is null or char_length(google_place_id) <= 300);
