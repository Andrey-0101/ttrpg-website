insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'character-portraits',
  'character-portraits',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own character portraits"
  on storage.objects;
drop policy if exists "Users can upload their own character portraits"
  on storage.objects;
drop policy if exists "Users can update their own character portraits"
  on storage.objects;
drop policy if exists "Users can delete their own character portraits"
  on storage.objects;

create policy "Users can read their own character portraits"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'character-portraits'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload their own character portraits"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'character-portraits'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can update their own character portraits"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'character-portraits'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'character-portraits'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their own character portraits"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'character-portraits'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
