-- Private document bucket. Documents are reached only through short-lived
-- signed URLs scoped to the requesting user; the bucket is never public.

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 52428800)
on conflict (id) do nothing;

create policy documents_storage_select on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and public.role_can_read('documents'));

create policy documents_storage_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.role_can_write('documents'));

create policy documents_storage_update on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and public.role_can_write('documents'))
  with check (bucket_id = 'documents' and public.role_can_write('documents'));

create policy documents_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and public.role_can_write('documents'));
