-- Run after 006_follows_likes.sql. Lets a player delete their own account from the site
-- (the "Delete my account" button on /privacy), which the privacy notice promises.
--
-- Deleting the auth.users row removes everything else through the foreign keys:
-- profiles and tier_lists cascade from auth.users; tier_placements cascades from tier_lists;
-- follows and list_likes cascade from profiles and tier_lists. Aggregated results are averages,
-- so nothing personal is left behind.
--
-- security definer, because the authenticated role can't touch auth.users itself. The function
-- only ever deletes the caller (auth.uid()), so it can't be pointed at anyone else.
create or replace function delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function delete_my_account from public, anon;
grant execute on function delete_my_account to authenticated;
