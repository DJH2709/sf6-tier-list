-- Run after 008_validate_lists.sql. Usernames may now use capital letters ("DannyH"), but
-- still only English letters, numbers and underscores: no spaces, dots, dashes or other
-- symbols. Names stay unique whatever the case, so "DannyH" and "dannyh" can't both exist,
-- and /u/dannyh still finds DannyH.
-- Safe to run twice. Every existing username is lowercase, so none of them can clash.

alter table profiles drop constraint if exists profiles_username_check;
alter table profiles add constraint profiles_username_check
  check (username ~ '^[A-Za-z0-9_]{3,20}$');

-- Swap the exact-match unique rule for a case-blind one.
alter table profiles drop constraint if exists profiles_username_key;
create unique index if not exists profiles_username_lower_key on profiles (lower(username));
