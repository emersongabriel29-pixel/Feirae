-- Feiraê: close inherited PostGIS API exposure, provision least-privilege profiles at signup,
-- and create a private storage bucket for onboarding documents.
-- This deliberately revokes access to extension metadata instead of enabling RLS without policies.

revoke all on table public.spatial_ref_sys from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text) from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text) from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text, boolean) from public, anon, authenticated;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role public.app_role;
  display_name text;
begin
  display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  selected_role := case
    when new.raw_user_meta_data ->> 'role' = 'feirante' then 'vendor'::public.app_role
    when new.raw_user_meta_data ->> 'role' = 'delivery' then 'delivery'::public.app_role
    else 'customer'::public.app_role
  end;

  insert into public.profiles (id, full_name, role)
  values (new.id, display_name, selected_role)
  on conflict (id) do nothing;

  if selected_role = 'vendor'::public.app_role then
    insert into public.vendor_profiles (id, business_name, approved)
    values (new.id, coalesce(display_name, 'Banca em cadastro'), false)
    on conflict (id) do nothing;
  elsif selected_role = 'delivery'::public.app_role then
    insert into public.delivery_profiles (id, approved)
    values (new.id, false)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
drop trigger if exists feirae_handle_new_auth_user on auth.users;
create trigger feirae_handle_new_auth_user
after insert on auth.users
for each row execute function private.handle_new_auth_user();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'onboarding-documents',
  'onboarding-documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'application/pdf']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users manage own onboarding files" on storage.objects;
create policy "users manage own onboarding files"
on storage.objects for all to authenticated
using (
  bucket_id = 'onboarding-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'onboarding-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
