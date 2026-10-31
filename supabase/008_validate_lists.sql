-- Run after 007_delete_account.sql. Every write to a tier list now goes through save_list(),
-- which checks the input, and the table itself refuses values the site never produces.
--
-- Before this, a signed-in user (anonymous voters included) could insert straight into
-- tier_lists and tier_placements with any rank, game, patch or item id, skipping the checks
-- in save_list and putting made-up tiles into the community results.

-- Shape checks on the columns the browser supplies. Ranks are checked against game_ranks in
-- save_list, so they aren't repeated here.
alter table tier_lists
  add constraint tier_lists_game_format check (game ~ '^[a-z0-9]{1,20}$'),
  add constraint tier_lists_category_format check (category ~ '^[a-z]{1,20}$'),
  add constraint tier_lists_patch_format check (patch ~ '^[0-9]{4}-[0-9]{2}$'),
  add constraint tier_lists_proof_url_format check (proof_url is null or (proof_url ~ '^https?://' and char_length(proof_url) <= 300));
alter table tier_placements
  add constraint tier_placements_item_format check (item_id ~ '^[a-z0-9-]{1,40}$');

-- save_list now runs as its owner (security definer) so the browser needs no direct write
-- access to the tables. It only ever touches rows where user_id = auth.uid(), so the row
-- policies it bypasses are re-stated inside it.
create or replace function save_list(
  p_game text,
  p_category text,
  p_patch text,
  p_rank text,
  p_proof_url text,
  p_is_public boolean,
  p_placements jsonb -- { "<item id>": <score 1..5>, ... }
) returns boolean -- true when an existing list was replaced
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_list_id uuid;
  v_updated boolean;
  v_needs_proof boolean;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  select needs_proof into v_needs_proof from game_ranks where game = p_game and rank_id = p_rank;
  if not found then
    raise exception 'unknown rank % for game %', p_rank, p_game using errcode = '22023';
  end if;
  if p_placements is null or jsonb_typeof(p_placements) <> 'object' then
    raise exception 'placements must be an object' using errcode = '22023';
  end if;
  -- Every roster so far is under 100 characters; this stops a list of thousands of made-up ids.
  if (select count(*) from jsonb_object_keys(p_placements)) > 150 then
    raise exception 'too many placements' using errcode = '22023';
  end if;

  select id into v_list_id from tier_lists
  where user_id = v_user and game = p_game and category = p_category and patch = p_patch;

  v_updated := v_list_id is not null;
  if v_updated then
    -- Verification is reset by tier_lists_reset_verification when the rank or proof link changes.
    update tier_lists set claimed_rank = p_rank, proof_url = p_proof_url, is_public = p_is_public
    where id = v_list_id and user_id = v_user;
    delete from tier_placements where list_id = v_list_id;
  else
    insert into tier_lists (user_id, game, category, patch, claimed_rank, verification, proof_url, is_public)
    values (v_user, p_game, p_category, p_patch, p_rank,
      case when v_needs_proof and p_proof_url is not null then 'pending' else 'none' end,
      p_proof_url, p_is_public)
    returning id into v_list_id;
  end if;

  -- The score check (1..5) and the item id format are table constraints and still apply here.
  insert into tier_placements (list_id, item_id, score)
  select v_list_id, key, value::smallint from jsonb_each_text(p_placements);

  return v_updated;
end $$;

revoke all on function save_list from public, anon;
grant execute on function save_list to authenticated;

-- Reads stay as they were (row policies decide what each role sees). Writes only via save_list.
revoke insert, update, delete on tier_lists from authenticated;
revoke insert, update, delete on tier_placements from authenticated;
