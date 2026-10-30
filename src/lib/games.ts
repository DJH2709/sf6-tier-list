// The games on the site. Rosters and rank ladders live in games.json so the SQL seed in
// supabase/005_games.sql can be checked against them (npm test). Edit that file to add a
// character, bump a patch or add a game, then run `npm run ranks-sql` if a ladder changed.
import data from "./games.json";

// What the tier list ranks. Weapons or abilities tabs would add their own category.
export const CATEGORY = "characters";

export type Band = "beginner" | "intermediate" | "advanced" | "elite";
export type Rank = { id: string; label: string; band: Band; needsProof?: boolean };
export type Character = { id: string; name: string };
export type Game = {
  id: string;
  name: string;
  short: string;
  // Bump on a balance patch or character release, so a new round of lists starts.
  patch: string;
  owner: string;
  // Where top-rank players link to prove their rank.
  proofSite: string;
  proofPlaceholder: string;
  characters: Character[];
  ranks: Rank[];
};

// "Pokémon Trainer" -> "pokemon-trainer". Keep in step with slug() in tests/games.test.mjs.
export const slug = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const GAMES: Game[] = data.games.map((g) => ({
  ...g,
  characters: g.characters.map((name) => ({ id: slug(name), name })),
  ranks: g.ranks as Rank[],
}));

export const DEFAULT_GAME = GAMES[0];

export function getGame(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

export const TIERS = [
  { label: "S", score: 5 },
  { label: "A", score: 4 },
  { label: "B", score: 3 },
  { label: "C", score: 2 },
  { label: "D", score: 1 },
] as const;

const BAND_LABELS: { id: Band; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "elite", label: "Elite" },
];

// The four bands with this game's rank names, e.g. "Rookie to Silver".
export function bandsFor(game: Game) {
  return BAND_LABELS.map((b) => {
    const ranks = game.ranks.filter((r) => r.band === b.id);
    const first = ranks[0]?.label ?? "";
    const last = ranks[ranks.length - 1]?.label ?? "";
    const range = ranks.length > 1 ? `${first} to ${last}` : first;
    if (b.id !== "elite") return { ...b, ranks: range };
    return { ...b, ranks: ranks.length > 1 ? `${first} and up, proven` : `${first}, proven` };
  });
}

export type Verification = "none" | "pending" | "approved" | "rejected";

// Unproven top-rank lists count one band lower until checked. Keep in step with
// list_bands in supabase/005_games.sql.
export function effectiveBand(game: Game, rankId: string, verification: Verification): Band {
  const rank = game.ranks.find((r) => r.id === rankId);
  if (!rank) return "beginner";
  if (rank.needsProof && verification !== "approved") return "advanced";
  return rank.band;
}

// A band's results stay hidden until this many lists exist.
export const MIN_LISTS = Number(process.env.NEXT_PUBLIC_MIN_LISTS ?? 20);
