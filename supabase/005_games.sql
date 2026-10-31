-- Run after 004_save_list.sql. Adds more games. Each game's rank ladder lives in game_ranks,
-- so the database knows which band a rank counts in and which ranks need proof.
-- Safe to run again: re-running updates the ladders. Doesn't touch profiles.

create table if not exists game_ranks (
  game text not null,
  rank_id text not null,
  band text not null check (band in ('beginner', 'intermediate', 'advanced', 'elite')),
  -- Top ranks are checked by hand. Unproven ones count in the Advanced band.
  needs_proof boolean not null default false,
  primary key (game, rank_id)
);

alter table game_ranks enable row level security;
drop policy if exists "game ranks are public" on game_ranks;
create policy "game ranks are public" on game_ranks for select using (true);
grant select on game_ranks to anon, authenticated;

-- Generated from src/lib/games.json by `npm run ranks-sql`. Don't edit by hand.
-- ranks:start
insert into game_ranks (game, rank_id, band, needs_proof) values
  ('sf6', 'rookie', 'beginner', false),
  ('sf6', 'iron', 'beginner', false),
  ('sf6', 'bronze', 'beginner', false),
  ('sf6', 'silver', 'beginner', false),
  ('sf6', 'gold', 'beginner', false),
  ('sf6', 'platinum', 'intermediate', false),
  ('sf6', 'diamond', 'intermediate', false),
  ('sf6', 'master', 'advanced', false),
  ('sf6', 'high_master', 'advanced', false),
  ('sf6', 'grand_master', 'elite', true),
  ('sf6', 'ultimate_master', 'elite', true),
  ('sf6', 'legend', 'elite', true),
  ('overwatch', 'bronze', 'beginner', false),
  ('overwatch', 'silver', 'beginner', false),
  ('overwatch', 'gold', 'beginner', false),
  ('overwatch', 'platinum', 'intermediate', false),
  ('overwatch', 'diamond', 'advanced', false),
  ('overwatch', 'master', 'advanced', false),
  ('overwatch', 'grandmaster', 'elite', true),
  ('overwatch', 'champion', 'elite', true),
  ('overwatch', 'top_500', 'elite', true),
  ('siege', 'copper', 'beginner', false),
  ('siege', 'bronze', 'beginner', false),
  ('siege', 'silver', 'beginner', false),
  ('siege', 'gold', 'intermediate', false),
  ('siege', 'platinum', 'intermediate', false),
  ('siege', 'emerald', 'advanced', false),
  ('siege', 'diamond', 'advanced', false),
  ('siege', 'champion', 'elite', true),
  ('siege', 'legend_division', 'elite', true),
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
  ('clashroyale', 'ultimate_champion', 'elite', true),
  ('tekken8', 'beginner', 'beginner', false),
  ('tekken8', '1st_dan', 'beginner', false),
  ('tekken8', '2nd_dan', 'beginner', false),
  ('tekken8', 'fighter', 'beginner', false),
  ('tekken8', 'strategist', 'beginner', false),
  ('tekken8', 'combatant', 'beginner', false),
  ('tekken8', 'brawler', 'beginner', false),
  ('tekken8', 'ranger', 'beginner', false),
  ('tekken8', 'cavalry', 'beginner', false),
  ('tekken8', 'warrior', 'beginner', false),
  ('tekken8', 'assailant', 'beginner', false),
  ('tekken8', 'dominator', 'beginner', false),
  ('tekken8', 'vanquisher', 'beginner', false),
  ('tekken8', 'destroyer', 'beginner', false),
  ('tekken8', 'eliminator', 'beginner', false),
  ('tekken8', 'garyu', 'intermediate', false),
  ('tekken8', 'shinryu', 'intermediate', false),
  ('tekken8', 'tenryu', 'intermediate', false),
  ('tekken8', 'mighty_ruler', 'intermediate', false),
  ('tekken8', 'flame_ruler', 'intermediate', false),
  ('tekken8', 'battle_ruler', 'intermediate', false),
  ('tekken8', 'fujin', 'advanced', false),
  ('tekken8', 'raijin', 'advanced', false),
  ('tekken8', 'kishin', 'advanced', false),
  ('tekken8', 'bushin', 'advanced', false),
  ('tekken8', 'tekken_king', 'elite', true),
  ('tekken8', 'tekken_emperor', 'elite', true),
  ('tekken8', 'tekken_god', 'elite', true),
  ('tekken8', 'tekken_god_supreme', 'elite', true),
  ('tekken8', 'god_of_destruction', 'elite', true),
  ('smash', 'gsp_under_3m', 'beginner', false),
  ('smash', 'gsp_3m_8m', 'intermediate', false),
  ('smash', 'gsp_8m_elite', 'advanced', false),
  ('smash', 'elite_smash', 'elite', true),
  ('mk1', 'apprentice', 'beginner', false),
  ('mk1', 'kombatant', 'beginner', false),
  ('mk1', 'warrior', 'intermediate', false),
  ('mk1', 'champion', 'intermediate', false),
  ('mk1', 'master', 'advanced', false),
  ('mk1', 'grand_master', 'advanced', false),
  ('mk1', 'demi_god', 'elite', true),
  ('mk1', 'god', 'elite', true),
  ('mk1', 'elder_god', 'elite', true),
  ('ggst', 'iron', 'beginner', false),
  ('ggst', 'bronze', 'beginner', false),
  ('ggst', 'silver', 'intermediate', false),
  ('ggst', 'gold', 'intermediate', false),
  ('ggst', 'platinum', 'advanced', false),
  ('ggst', 'diamond', 'advanced', false),
  ('ggst', 'vanquisher', 'elite', true),
  ('brawlhalla', 'tin', 'beginner', false),
  ('brawlhalla', 'bronze', 'beginner', false),
  ('brawlhalla', 'silver', 'intermediate', false),
  ('brawlhalla', 'gold', 'intermediate', false),
  ('brawlhalla', 'platinum', 'advanced', false),
  ('brawlhalla', 'diamond', 'advanced', false),
  ('brawlhalla', 'valhallan', 'elite', true),
  ('rivals2', 'bronze', 'beginner', false),
  ('rivals2', 'silver', 'intermediate', false),
  ('rivals2', 'gold', 'intermediate', false),
  ('rivals2', 'platinum', 'advanced', false),
  ('rivals2', 'diamond', 'advanced', false),
  ('rivals2', 'master', 'elite', true),
  ('cotw', 'newcomer', 'beginner', false),
  ('cotw', 'iron_wolf', 'beginner', false),
  ('cotw', 'bronze_wolf', 'beginner', false),
  ('cotw', 'above_bronze_wolf', 'intermediate', false),
  ('cotw', 'diamond_wolf', 'advanced', false),
  ('cotw', 'legendary_wolf', 'elite', true),
  ('cotw', 'garou', 'elite', true),
  ('gbvsr', 'd', 'beginner', false),
  ('gbvsr', 'c', 'beginner', false),
  ('gbvsr', 'b', 'intermediate', false),
  ('gbvsr', 'a', 'intermediate', false),
  ('gbvsr', 's', 'advanced', false),
  ('gbvsr', 's_plus', 'advanced', false),
  ('gbvsr', 's_plus_plus', 'advanced', false),
  ('gbvsr', 'master', 'elite', true),
  ('invincible', 'new_blood', 'beginner', false),
  ('invincible', 'rookie', 'beginner', false),
  ('invincible', 'bronze', 'beginner', false),
  ('invincible', 'silver', 'intermediate', false),
  ('invincible', 'gold', 'intermediate', false),
  ('invincible', 'platinum', 'advanced', false),
  ('invincible', 'diamond', 'advanced', false),
  ('invincible', 'superhero', 'elite', true),
  ('invincible', 'guardian_of_the_globe', 'elite', true)
on conflict (game, rank_id) do update set band = excluded.band, needs_proof = excluded.needs_proof;
-- ranks:end

-- Bands now come from game_ranks instead of a hard-coded SF6 list.
-- Keep in step with effectiveBand() in src/lib/games.ts.
create or replace view list_bands as
select l.id, l.game, l.category, l.patch,
  case
    when r.rank_id is null then 'beginner'
    when r.needs_proof and l.verification <> 'approved' then 'advanced'
    else r.band
  end as band
from tier_lists l
left join game_ranks r on r.game = l.game and r.rank_id = l.claimed_rank;

-- A rank that isn't on the game's ladder is refused, so lists can't land in a made-up band.
create or replace function save_list(
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
  v_needs_proof boolean;
begin
  select needs_proof into v_needs_proof from game_ranks where game = p_game and rank_id = p_rank;
  if not found then
    raise exception 'unknown rank % for game %', p_rank, p_game using errcode = '22023';
  end if;

  select id into v_list_id from tier_lists
  where user_id = auth.uid() and game = p_game and category = p_category and patch = p_patch;

  v_updated := v_list_id is not null;
  if v_updated then
    -- Verification is reset by tier_lists_reset_verification when the rank or proof link changes.
    update tier_lists set claimed_rank = p_rank, proof_url = p_proof_url, is_public = p_is_public
    where id = v_list_id;
    delete from tier_placements where list_id = v_list_id;
  else
    insert into tier_lists (game, category, patch, claimed_rank, verification, proof_url, is_public)
    values (p_game, p_category, p_patch, p_rank,
      case when v_needs_proof and p_proof_url is not null then 'pending' else 'none' end,
      p_proof_url, p_is_public)
    returning id into v_list_id;
  end if;

  insert into tier_placements (list_id, item_id, score)
  select v_list_id, key, value::smallint from jsonb_each_text(p_placements);

  return v_updated;
end $$;

-- A changed rank or proof link needs checking again.
create or replace function tier_lists_reset_verification() returns trigger language plpgsql as $$
begin
  if new.claimed_rank is distinct from old.claimed_rank or new.proof_url is distinct from old.proof_url then
    new.verification := case
      when new.proof_url is not null and exists (
        select 1 from game_ranks r where r.game = new.game and r.rank_id = new.claimed_rank and r.needs_proof)
        then 'pending' else 'none' end;
  end if;
  return new;
end $$;
