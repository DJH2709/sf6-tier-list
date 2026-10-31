-- Run after 009_username_capitals.sql. SF6 players said Diamond doesn't belong with Master
-- and High Master, so the SF6 bands move up one rank at the Gold and Diamond steps:
--   Beginner      Rookie to Gold        (Gold was Intermediate)
--   Intermediate  Platinum to Diamond   (Diamond was Advanced)
--   Advanced      Master to High Master
--   Elite         Grand Master and up, proven
-- Bands are worked out when results are read (list_bands view), so lists already saved
-- move to their new band straight away. Nothing else changes. Safe to run again.
update game_ranks set band = 'beginner' where game = 'sf6' and rank_id = 'gold';
update game_ranks set band = 'intermediate' where game = 'sf6' and rank_id = 'diamond';
