-- Feiraê: repeat least-privilege ACLs for PostGIS helper endpoints.
-- The extension-owned metadata table cannot safely be altered for RLS by this migration role.
-- This migration intentionally revokes direct API access; it does not move or alter the extension.

revoke all on table public.spatial_ref_sys from public, anon, authenticated;

revoke execute on function public.st_estimatedextent(text, text) from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text) from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text, boolean) from public, anon, authenticated;
