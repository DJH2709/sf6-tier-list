-- Run after 015. Pro and creator tags now say which game they are for ("Pro · Overwatch"),
-- because a Siege pro's tier list says little about Clash Royale. Also adds a coach tag.
-- Like the tag itself, tag_game is set by the site owner in the Supabase table editor, never
-- by the player: 006 only granted players the username, display_name and avatar_url columns,
-- and a new column gets no grant, so players still can't write it.

-- The stored value stays 'influencer' so existing tags keep working; the site shows it as
-- "Creator".
alter table profiles drop constraint if exists profiles_tag_check;
alter table profiles add constraint profiles_tag_check check (tag in ('pro', 'influencer', 'coach'));

-- A game id from the site's URL, e.g. 'overwatch', 'siege', 'sf6'. Empty means no game shown.
alter table profiles add column if not exists tag_game text check (tag_game ~ '^[a-z0-9]{1,20}$');
