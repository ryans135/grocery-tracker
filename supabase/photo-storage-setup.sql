-- =============================================================
-- Move item photos out of the database and into Supabase Storage.
-- Run this in the Supabase SQL editor (uses service_role, bypasses RLS).
-- Safe to re-run.
--
-- Why: photos were being saved as base64 text directly in the
-- items.photo column. A single photo could be 3-4 MB of text, and
-- sorting/fetching the whole items table then had to move tens of
-- megabytes through a tiny free-tier instance — slow enough to hit
-- Postgres's statement timeout. Storage buckets serve files from a
-- CDN URL instead, so the photo column just holds a short link.
-- =============================================================

-- 1) Create a public bucket for item photos (public = readable via
--    URL without auth, matching this app's no-login household use).
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

-- 2) This app has no login — it authenticates every request with the
--    anon key, same as the items/shopping_list/logs tables. Mirror
--    that here so uploads/reads/deletes on this bucket work the
--    same way.
drop policy if exists "item-photos anon select" on storage.objects;
create policy "item-photos anon select"
  on storage.objects for select to anon
  using (bucket_id = 'item-photos');

drop policy if exists "item-photos anon insert" on storage.objects;
create policy "item-photos anon insert"
  on storage.objects for insert to anon
  with check (bucket_id = 'item-photos');

drop policy if exists "item-photos anon update" on storage.objects;
create policy "item-photos anon update"
  on storage.objects for update to anon
  using (bucket_id = 'item-photos');

drop policy if exists "item-photos anon delete" on storage.objects;
create policy "item-photos anon delete"
  on storage.objects for delete to anon
  using (bucket_id = 'item-photos');

-- 3) Verify: should return one row for the new bucket.
select id, name, public from storage.buckets where id = 'item-photos';
