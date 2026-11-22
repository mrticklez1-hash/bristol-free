-- Update 17: two more facilities, changing_places and creche (Nov 2026)
-- Lets research batches save them now. Their icons appear on the site after the next deploy.
-- Safe to run more than once.

alter table public.listing_facilities drop constraint if exists listing_facilities_facility_check;
alter table public.listing_facilities add constraint listing_facilities_facility_check check (facility in (
  'pushchair','baby_changing','toilets','accessible_toilet','changing_places','step_free',
  'free_parking','paid_parking','cafe','high_chairs','indoor','outdoor',
  'picnic','dog_friendly','feeding','quiet_send','creche'));
