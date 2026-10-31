-- Run after 011_tekken_bands.sql. Adds Overwatch and Rainbow Six Siege X rank ladders, so
-- lists for those games can be saved. The rosters themselves need no SQL.
--   Overwatch  Beginner Bronze to Gold | Intermediate Platinum | Advanced Diamond to Master
--              | Elite Grandmaster, Champion, Top 500 (proven)
--   Siege X    Beginner Copper to Silver | Intermediate Gold to Platinum | Advanced Emerald to
--              Diamond | Elite Champion and Legend division (proven)
-- Safe to run again.
insert into game_ranks (game, rank_id, band, needs_proof) values
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
  ('siege', 'legend_division', 'elite', true)
on conflict (game, rank_id) do update set band = excluded.band, needs_proof = excluded.needs_proof;
