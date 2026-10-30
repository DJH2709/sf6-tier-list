import { bandsFor, DEFAULT_GAME, type Band, type Game } from "@/lib/games";
import type { MessageKey } from "@/locales/en";
import type { Translate } from "./config";

// SF6's game, rank and band-range names are in the locale files (game.sf6, rank.<id>,
// band.<id>.ranks). Other games show their English names from games.json until they get
// keys of their own; rank ids repeat across games, so they can't share SF6's keys.
const hasKeys = (game: Game) => game.id === DEFAULT_GAME.id;

export function gameName(game: Game, t: Translate) {
  return hasKeys(game) ? t(`game.${game.id}` as MessageKey) : game.name;
}

export function rankName(game: Game, rankId: string, t: Translate) {
  const rank = game.ranks.find((r) => r.id === rankId);
  if (!rank) return rankId;
  return hasKeys(game) ? t(`rank.${rank.id}` as MessageKey) : rank.label;
}

export function bandRanks(game: Game, band: Band, t: Translate) {
  return hasKeys(game) ? t(`band.${band}.ranks` as MessageKey) : bandsFor(game).find((b) => b.id === band)!.ranks;
}
