-- Run after 010_sf6_diamond_band.sql. Same fix as SF6, for Tekken 8: Advanced ran from
-- Garyu all the way to Bushin (10 ranks). New Tekken 8 bands:
--   Beginner      Beginner to Eliminator     (Cavalry to Eliminator were Intermediate)
--   Intermediate  Garyu to Battle Ruler      (were Advanced)
--   Advanced      Fujin to Bushin
--   Elite         Tekken King and up, proven
-- Bands are worked out when results are read, so saved lists move straight away. Safe to run again.
update game_ranks set band = 'beginner' where game = 'tekken8'
  and rank_id in ('cavalry', 'warrior', 'assailant', 'dominator', 'vanquisher', 'destroyer', 'eliminator');
update game_ranks set band = 'intermediate' where game = 'tekken8'
  and rank_id in ('garyu', 'shinryu', 'tenryu', 'mighty_ruler', 'flame_ruler', 'battle_ruler');
