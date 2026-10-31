-- Run after 012_overwatch_siege.sql (or after 011_tekken_bands.sql if 012 isn't run yet; they
-- don't touch the same things). Lets players order characters inside a tier.
--
-- Adds tier_placements.sort_index (0 = first in the list, read left to right, S row first).
-- It is only for showing a player's own list in the order they dragged it into. Community
-- results still use the 1..5 tier score alone, so this changes no averages.
-- Lists saved before this have no order (sort_index stays null) and show as they did.
--
-- save_list gets a new last argument, p_order: the item ids in the player's order. It has a
-- default, so the site as it is now (which doesn't send it) keeps saving while this runs.
-- Safe to run more than once.
alter table tier_placements add column if not exists sort_index smallint
  check (sort_index is null or sort_index between 0 and 149);

drop function if exists save_list(text, text, text, text, text, boolean, jsonb);
drop function if exists save_list(text, text, text, text, text, boolean, jsonb, text[]);

create function save_list(
  p_game text,
  p_category text,
  p_patch text,
  p_rank text,
  p_proof_url text,
  p_is_public boolean,
  p_placements jsonb, -- { "<item id>": <score 1..5>, ... }
  p_order text[] default null -- item ids in the player's order; ids not in it get no order
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
  if (select count(*) from jsonb_object_keys(p_placements)) > 150
     or coalesce(cardinality(p_order), 0) > 150 then
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
  -- array_position counts from 1, so subtract 1. An id missing from p_order gets null.
  insert into tier_placements (list_id, item_id, score, sort_index)
  select v_list_id, key, value::smallint, array_position(p_order, key) - 1
  from jsonb_each_text(p_placements);

  return v_updated;
end $$;

revoke all on function save_list from public, anon;
grant execute on function save_list to authenticated;

-- Reads stay as they were (row policies decide what each role sees). Writes only via save_list.
revoke insert, update, delete on tier_lists from authenticated;
revoke insert, update, delete on tier_placements from authenticated;
