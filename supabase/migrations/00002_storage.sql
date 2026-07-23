-- =============================================================
-- SPUDS — Storage buckets for user-uploaded images
-- =============================================================

-- Public-read buckets with a 5 MB limit and image-only mime types.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('event-images', 'event-images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('community-images', 'community-images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Anyone can read (buckets are public); uploads are scoped to the
-- signed-in user's own folder: objects are stored under "<uid>/<file>".
create policy "Public read for image buckets"
  on storage.objects for select
  using (bucket_id in ('event-images', 'avatars', 'community-images'));

create policy "Users upload to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('event-images', 'avatars', 'community-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update their own objects"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('event-images', 'avatars', 'community-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete their own objects"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('event-images', 'avatars', 'community-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
