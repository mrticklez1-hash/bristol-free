-- Update 21: a photo credit for events (Nov 2026), e.g. "Jane Smith / Pexels". Safe to run more than once.
alter table public.events add column if not exists photo_credit text check (char_length(photo_credit) <= 300);
