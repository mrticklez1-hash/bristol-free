-- Update 16: smarter duplicate matching for research batches (Nov 2026)
-- Adds two helpers that the SQL templates in the research brief use, so that
-- "The Jumping Jellybeans Ltd" and "Jumping Jellybeans soft play" count as the same place.
-- Database only: nothing on the site changes. Safe to run more than once.

-- "The Jumping Jellybeans Soft Play Ltd!" -> "jumpingjellybeans"
create or replace function public.norm_name(t text) returns text
language sql immutable as $$
  select regexp_replace(
           regexp_replace(lower(coalesce(t, '')), '^the\s+|\m(ltd|limited|cic|uk|bristol)\M|\m(soft play|softplay|cafe|café|centre|center)\M', '', 'g'),
         '[^a-z0-9]', '', 'g')
$$;

-- "bs5 6xx" / "BS56XX" -> "BS56XX"
create or replace function public.norm_postcode(t text) returns text
language sql immutable as $$ select nullif(upper(regexp_replace(coalesce(t, ''), '\s', '', 'g')), '') $$;

-- Is this research row the same place as an existing listing?
-- Same tidied-up name, and the postcodes agree (or one of them is missing),
-- or the same postcode and one name contains the other.
create or replace function public.same_place(l_name text, l_pc text, v_name text, v_pc text) returns boolean
language sql immutable as $$
  select (public.norm_name(l_name) = public.norm_name(v_name)
          and (public.norm_postcode(l_pc) is null or public.norm_postcode(v_pc) is null or public.norm_postcode(l_pc) = public.norm_postcode(v_pc)))
      or (public.norm_postcode(l_pc) = public.norm_postcode(v_pc)
          and length(public.norm_name(l_name)) >= 4 and length(public.norm_name(v_name)) >= 4
          and (public.norm_name(l_name) like '%' || public.norm_name(v_name) || '%' or public.norm_name(v_name) like '%' || public.norm_name(l_name) || '%'))
$$;
