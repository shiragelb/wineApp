-- Hang Tickets — Phase 2 storage
-- Paste this into the Supabase SQL Editor after the Phase 1 schema.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hang_images',
  'hang_images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can upload hang images" on storage.objects;
create policy "Authenticated users can upload hang images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'hang_images');

drop policy if exists "Public can read hang images" on storage.objects;
create policy "Public can read hang images"
on storage.objects
for select
using (bucket_id = 'hang_images');
