-- Run after 004_save_list.sql (005 is the multi-game file). Players with a profile can
-- follow each other and like each other's lists, and the site owner can tag a profile
-- as a pro or an influencer.

-- Tags are set by hand in the Supabase table editor, never by the player, or they mean nothing.
alter table profiles add column tag text check (tag in ('pro', 'influencer'));

-- Supabase grants every column to both roles by default and 002 did too. Narrow it so a
-- player can't tag themselves.
revoke insert, update on profiles from anon, authenticated;
grant insert (id, username, display_name, avatar_url) on profiles to authenticated;
grant update (username, display_name, avatar_url) on profiles to authenticated;

-- Both sides need a profile, so anonymous voters can't follow or be followed.
create table follows (
  follower_id uuid not null references profiles on delete cascade default auth.uid(),
  followee_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee on follows (followee_id);

alter table follows enable row level security;

-- Who follows whom is public, like the profiles themselves.
create policy "follows are public" on follows for select using (true);
create policy "own follows insert" on follows for insert with check (follower_id = auth.uid());
create policy "own follows delete" on follows for delete using (follower_id = auth.uid());

grant select on follows to anon, authenticated;
grant insert, delete on follows to authenticated;

-- One like per player per list. Editing a list keeps its likes (save_list updates in place);
-- a new patch is a new list and starts from zero.
create table list_likes (
  user_id uuid not null references profiles on delete cascade default auth.uid(),
  list_id uuid not null references tier_lists on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, list_id)
);
create index list_likes_list on list_likes (list_id);

alter table list_likes enable row level security;

create policy "likes are public" on list_likes for select using (true);
-- Only someone else's public list. The tier_lists policies decide which lists are visible.
create policy "own likes insert" on list_likes for insert with check (
  user_id = auth.uid()
  and exists (select 1 from tier_lists l where l.id = list_id and l.is_public and l.user_id <> auth.uid())
);
create policy "own likes delete" on list_likes for delete using (user_id = auth.uid());

grant select on list_likes to anon, authenticated;
grant insert, delete on list_likes to authenticated;
