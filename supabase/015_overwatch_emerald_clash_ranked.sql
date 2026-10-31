-- Run after 014_order_in_tier.sql. Two ladder fixes. Safe to run again.
--
-- 1. Overwatch added Emerald between Platinum and Diamond in Season 4 (Aug 2026); 012 missed it.
--    Beginner Bronze to Gold | Intermediate Platinum to Emerald | Advanced Diamond to Master
--    | Elite Grandmaster, Champion, Top 500 (proven)
-- 2. Clash Royale goes by Ranked league instead of trophies: Unranked, the 6 leagues, then
--    Ultimate Champion (league 7).
--    Beginner Unranked to Master II | Intermediate Master III to Champion
--    | Advanced Grand Champion to Royal Champion | Elite Ultimate Champion (proven)
--    Lists saved with an old trophy bracket move to Unranked, then the brackets are removed.
insert into game_ranks (game, rank_id, band, needs_proof) values
  ('overwatch', 'emerald', 'intermediate', false),
  ('clashroyale', 'unranked', 'beginner', false),
  ('clashroyale', 'master_1', 'beginner', false),
  ('clashroyale', 'master_2', 'beginner', false),
  ('clashroyale', 'master_3', 'intermediate', false),
  ('clashroyale', 'champion', 'intermediate', false),
  ('clashroyale', 'grand_champion', 'advanced', false),
  ('clashroyale', 'royal_champion', 'advanced', false),
  ('clashroyale', 'ultimate_champion', 'elite', true)
on conflict (game, rank_id) do update set band = excluded.band, needs_proof = excluded.needs_proof;

update tier_lists set claimed_rank = 'unranked'
where game = 'clashroyale' and claimed_rank in ('under_5000', 't5000', 't8000', 't10000', 't12000');
delete from game_ranks
where game = 'clashroyale' and rank_id in ('under_5000', 't5000', 't8000', 't10000', 't12000');
