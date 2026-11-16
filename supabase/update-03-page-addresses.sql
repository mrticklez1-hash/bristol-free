-- Gives every listing a web address like /place/blaise-castle-estate. Safe to run more than once.
alter table public.listings add column if not exists slug text;

create or replace function public.slugify(t text) returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.listings_set_slug() returns trigger language plpgsql as $$
declare base text; s text; n int := 1;
begin
  if new.slug is null or new.slug = '' then
    base := public.slugify(new.name);
    if base = '' then base := 'place'; end if;
    s := base;
    while exists (select 1 from public.listings where slug = s and id <> new.id) loop
      n := n + 1; s := base || '-' || n;
    end loop;
    new.slug := s;
  else
    new.slug := public.slugify(new.slug);
  end if;
  return new;
end $$;

drop trigger if exists listings_slug on public.listings;
create trigger listings_slug before insert or update on public.listings
  for each row execute function public.listings_set_slug();

-- fill in addresses for existing listings
update public.listings set slug = null where slug is null;

create unique index if not exists listings_slug_key on public.listings (slug);
notify pgrst, 'reload schema';
