-- Run after schema.sql. Adds public profiles: a player who picks a username
-- makes their tier lists public at /u/<username>. Anonymous voters stay private.

create table profiles (
  id uuid primary key references auth.users on delete cascade default auth.uid(),
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 40),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are public" on profiles for select using (true);
-- Only real accounts (signed in with Discord), not anonymous voters, can claim a username.
create policy "own profile insert" on profiles for insert
  with check (id = auth.uid() and not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false));
create policy "own profile update" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

grant select on profiles to anon, authenticated;
grant insert, update on profiles to authenticated;

-- Lists belonging to a player with a profile are public.
create policy "public lists read" on tier_lists for select
  using (exists (select 1 from profiles p where p.id = user_id));
create policy "public placements read" on tier_placements for select
  using (exists (select 1 from tier_lists l join profiles p on p.id = l.user_id where l.id = list_id));

grant select on tier_lists, tier_placements to anon;
