-- =============================================================
-- Lock the app down to signed-in household members.
-- Run in the Supabase SQL editor (uses service_role, bypasses RLS).
-- Safe to re-run.
--
-- Why: the app is going on the public internet (GitHub Pages). The
-- anon key ships inside the JS bundle, so "anon can do anything"
-- would let anyone with the URL read/edit/delete the pantry.
-- After this, only users whose email is in public.allowed_users
-- and who have signed in via the magic link can touch the data.
--
-- ⚠ The old no-login build stops working the moment this runs —
--   deploy the login build first (or at the same time).
-- =============================================================

-- 1) Who's allowed in. Add/remove household emails here.
create table if not exists public.allowed_users (
  email text primary key
);
alter table public.allowed_users enable row level security;
-- No policies on allowed_users: clients can't read or edit the list.

insert into public.allowed_users (email) values
  ('ryan.sulistian@gmail.com'),
  ('eunike.florenciaa@gmail.com')
on conflict do nothing;

-- 2) Helper used by every policy (and by the app's login screen).
create or replace function public.is_household()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.allowed_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;
revoke all on function public.is_household() from public, anon;
grant execute on function public.is_household() to authenticated;

-- 3) Replace every existing policy on the app tables with a
--    household-only one.
do $$
declare
  t text;
  p record;
begin
  foreach t in array array['items', 'shopping_list', 'logs'] loop
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "household all" on public.%I for all to authenticated
         using ((select public.is_household())) with check ((select public.is_household()))', t);
  end loop;
end $$;

-- 4) Photo bucket: only household members can upload/replace/delete.
--    The bucket stays public-read so <img src> keeps working; files
--    are named by random UUID, so URLs aren't guessable.
drop policy if exists "item-photos anon select" on storage.objects;
drop policy if exists "item-photos anon insert" on storage.objects;
drop policy if exists "item-photos anon update" on storage.objects;
drop policy if exists "item-photos anon delete" on storage.objects;

-- (select is needed by storage .remove(); public URLs bypass it anyway)
drop policy if exists "item-photos household select" on storage.objects;
create policy "item-photos household select"
  on storage.objects for select to authenticated
  using (bucket_id = 'item-photos' and (select public.is_household()));

drop policy if exists "item-photos household insert" on storage.objects;
create policy "item-photos household insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'item-photos' and (select public.is_household()));

drop policy if exists "item-photos household update" on storage.objects;
create policy "item-photos household update"
  on storage.objects for update to authenticated
  using (bucket_id = 'item-photos' and (select public.is_household()));

drop policy if exists "item-photos household delete" on storage.objects;
create policy "item-photos household delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'item-photos' and (select public.is_household()));

-- 5) Verify: every row should show roles {authenticated}.
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where (schemaname = 'public' and tablename in ('items', 'shopping_list', 'logs'))
   or (schemaname = 'storage' and policyname like 'item-photos%')
order by 1, 2, 3;
