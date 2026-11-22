-- Update 18: new rows start as drafts unless they say otherwise (Nov 2026)
-- A safety net: an insert that forgets the status no longer goes straight onto the live site.
-- Existing rows are not changed. Safe to run more than once.

alter table public.listings alter column status set default 'draft';
alter table public.events   alter column status set default 'draft';
alter table public.deals    alter column status set default 'draft';
alter table public.recipes  alter column status set default 'draft';
