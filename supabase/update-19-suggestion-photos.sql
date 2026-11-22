-- Update 19: photos with "Suggest an event" and "Offer a deal" (Nov 2026)
-- Parents and businesses can add one photo to a suggestion. Photos go into a PRIVATE
-- storage area that only admins can see. Nothing is public until you add the event or
-- deal in admin, which copies the photo into the normal public photos.
-- Limits: 3 MB, JPEG/PNG/WebP only (photos are shrunk in the browser first anyway).
-- Safe to run more than once. Paste into Supabase > SQL Editor and click Run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('suggestion-photos', 'suggestion-photos', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can send a suggestion photo" on storage.objects;
create policy "Anyone can send a suggestion photo" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'suggestion-photos' and (storage.foldername(name))[1] = 'pending');

drop policy if exists "Admins see suggestion photos" on storage.objects;
create policy "Admins see suggestion photos" on storage.objects for select
  using (bucket_id = 'suggestion-photos' and public.is_admin());

drop policy if exists "Admins remove suggestion photos" on storage.objects;
create policy "Admins remove suggestion photos" on storage.objects for delete
  using (bucket_id = 'suggestion-photos' and public.is_admin());
