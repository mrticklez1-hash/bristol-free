-- Update 14: a one-line parking note on each listing (Nov 2026)
-- e.g. "Free car park on site" or "Pay and display, £2 for 2 hours, 5 min walk".
-- Safe to run more than once. Paste into Supabase > SQL Editor and click Run.
alter table public.listings add column if not exists parking_note text;
alter table public.listings drop constraint if exists listings_parking_note_check;
alter table public.listings add constraint listings_parking_note_check check (parking_note is null or char_length(parking_note) <= 160);
