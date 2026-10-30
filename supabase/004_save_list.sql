-- Run after 003_edit_lists.sql. Saves a list and its placements in one transaction,
-- so a failed save can't leave a list with its placements deleted.
-- Runs as the caller, so the row policies and column grants from earlier files still apply.
create function save_list(
  p_game text,
  p_category text,
  p_patch text,
  p_rank text,
  p_proof_url text,
  p_is_public boolean,
  p_placements jsonb -- { "<item id>": <score 1..5>, ... }
) returns boolean -- true when an existing list was replaced
language plpgsql security invoker set search_path = public as $$
declare
  v_list_id uuid;
  v_updated boolean;
begin
  select id into v_list_id from tier_lists
  where user_id = auth.uid() and game = p_game and category = p_category and patch = p_patch;

  v_updated := v_list_id is not null;
  if v_updated then
    -- Verification is reset by tier_lists_reset_verification when the rank or proof link changes.
    update tier_lists set claimed_rank = p_rank, proof_url = p_proof_url, is_public = p_is_public
    where id = v_list_id;
    delete from tier_placements where list_id = v_list_id;
  else
    -- Keep the rank list in step with needsProof in src/lib/sf6.ts.
    insert into tier_lists (game, category, patch, claimed_rank, verification, proof_url, is_public)
    values (p_game, p_category, p_patch, p_rank,
      case when p_rank in ('grand_master', 'ultimate_master', 'legend') and p_proof_url is not null
        then 'pending' else 'none' end,
      p_proof_url, p_is_public)
    returning id into v_list_id;
  end if;

  insert into tier_placements (list_id, item_id, score)
  select v_list_id, key, value::smallint from jsonb_each_text(p_placements);

  return v_updated;
end $$;

revoke all on function save_list from public, anon;
grant execute on function save_list to authenticated;
