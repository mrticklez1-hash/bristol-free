-- Adds a photo credit to listings (for Creative Commons photos). Safe to run more than once.
alter table public.listings add column if not exists photo_credit text check (char_length(photo_credit) <= 300);
