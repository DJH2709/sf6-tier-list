-- Run after 012_overwatch_siege.sql. Adds Clash Royale.
-- 1. The Clash Royale ladder: trophies for players outside Ranked, then the Ranked leagues.
--      Beginner      under 5,000 to 9,999 trophies
--      Intermediate  10,000+ trophies, Master I to III
--      Advanced      Champion, Grand Champion, Royal Champion
--      Elite         Ultimate Champion, proven
-- 2. save_list allowed at most 150 placements. Clash Royale has 184 (123 cards, 43 evolutions,
--    18 heroes), so the cap goes up to 250. Nothing else in save_list changes.
-- Safe to run again.
insert into game_ranks (game, rank_id, band, needs_proof) values
  ('clashroyale', 'under_5000', 'beginner', false),
  ('clashroyale', 't5000', 'beginner', false),
  ('clashroyale', 't8000', 'beginner', false),
  ('clashroyale', 't10000', 'intermediate', false),
  ('clashroyale', 't12000', 'intermediate', false),
  ('clashroyale', 'master_1', 'intermediate', false),
  ('clashroyale', 'master_2', 'intermediate', false),
  ('clashroyale', 'master_3', 'intermediate', false),
  ('clashroyale', 'champion', 'advanced', false),
  ('clashroyale', 'grand_champion', 'advanced', false),
  ('clashroyale', 'royal_champion', 'advanced', false),
  ('clashroyale', 'ultimate_champion', 'elite', true)
on conflict (game, rank_id) do update set band = excluded.band, needs_proof = excluded.needs_proof;

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
  -- Clash Royale has 184 entries (cards, evolutions, heroes); this still stops thousands of made-up ids.
  if (select count(*) from jsonb_object_keys(p_placements)) > 250 then
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
