// The games on the site. Rosters and rank ladders live in games.json so the SQL seed in
// supabase/005_games.sql can be checked against them (npm test). Edit that file to add a
// character, bump a patch or add a game, then run `npm run ranks-sql` if a ladder changed.
import data from "./games.json";

// What a tier list ranks. Every game has characters; a game can add tabs for other things to
// rank (Siege's weapons). Each tab is its own set of lists in the database (tier_lists.category)
// with its own results, so a weapons vote never mixes with an operators vote.
export const CATEGORY = "characters";

export type Band = "beginner" | "intermediate" | "advanced" | "elite";
export type Rank = { id: string; label: string; band: Band; needsProof?: boolean };
export type Character = { id: string; name: string };
// Optional ways to filter a roster: a hero's role, a Siege operator's side, a LoL lane. A
// character can sit in more than one (a champion played mid and top). Filters only change what
// is shown; every list still covers the whole roster, so votes aren't split across roles.
export type RoleGroup = { label: string; ids: string[] };
// Genre tags for the games page filter. A game can have several (Smash is a fighting game and a
// platform fighter). Labels are in the locale files as genre.<id>; tests check every game uses
// only these.
export const GENRES = ["fighting", "platform", "anime", "shooter", "hero", "tactical", "battleroyale", "moba", "mobile", "strategy"] as const;
export type Genre = (typeof GENRES)[number];
export type Game = {
  id: string;
  name: string;
  short: string;
  genres: Genre[];
  // Bump on a balance patch or character release, so a new round of lists starts.
  patch: string;
  owner: string;
  // Where top-rank players link to prove their rank.
  proofSite: string;
  proofPlaceholder: string;
  // Extra line under the rank picker, e.g. which of several per-role ranks to pick.
  rankHint?: string;
  // How many characters a list must place. Unset means all of them.
  minPlaced?: number;
  // Wording a publisher's fan policy asks for, shown in the footer of that game's page.
  disclaimer?: string;
  // The items of the tab being shown. For the characters tab these are the roster.
  characters: Character[];
  roles?: RoleGroup[];
  ranks: Rank[];
  // Which tab this Game shows ("characters" unless withCategory picked another).
  category: string;
  // Every tab the game has, characters first, with its English label ("Operators", "Weapons").
  tabs: Tab[];
};
export type Tab = { category: string; label: string };

// Extra tabs in games.json: { "weapons": { "label": "Weapons", "characters": [...], "roles": {...} } }.
type TabData = { label: string; characters: string[]; roles?: Record<string, string[]>; minPlaced?: number };

// "Pokémon Trainer" -> "pokemon-trainer". Keep in step with slug() in tests/games.test.mjs.
export const slug = (name: string) =>
  name.replace(/ø/gi, "o").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type GameData = Omit<Game, "characters" | "roles" | "genres" | "category" | "tabs"> & {
  genres: string[];
  // Label of the characters tab when a game has other tabs, e.g. "Operators". Default "Characters".
  itemsLabel?: string;
  tabs?: Record<string, TabData>; characters: string[]; roles?: Record<string, string[]> };

const items = (names: string[]) => names.map((name) => ({ id: slug(name), name }));
const roleGroups = (roles?: Record<string, string[]>) =>
  roles && Object.entries(roles).map(([label, names]) => ({ label, ids: names.map(slug) }));

const RAW = data.games as GameData[];

export const GAMES: Game[] = RAW.map(({ itemsLabel, tabs, ...g }) => ({
  ...g,
  genres: g.genres as Genre[],
  characters: items(g.characters),
  roles: roleGroups(g.roles),
  ranks: g.ranks as Rank[],
  category: CATEGORY,
  tabs: [
    { category: CATEGORY, label: itemsLabel ?? "Characters" },
    ...Object.entries(tabs ?? {}).map(([category, tab]) => ({ category, label: tab.label })),
  ],
}));

// The same game showing another tab's items. Cached, so the object stays the same between
// renders and effects that depend on it don't re-run. An unknown tab gives the characters tab.
const tabCache = new Map<string, Game>();
export function withCategory(game: Game, category: string | null | undefined): Game {
  if (!category || category === game.category) return game;
  const key = `${game.id}:${category}`;
  const cached = tabCache.get(key);
  if (cached) return cached;
  const base = GAMES.find((g) => g.id === game.id) ?? game;
  if (category === CATEGORY) return base;
  const tab = RAW.find((g) => g.id === game.id)?.tabs?.[category];
  if (!tab) return base;
  const shown: Game = { ...base, category, characters: items(tab.characters), roles: roleGroups(tab.roles), minPlaced: tab.minPlaced };
  tabCache.set(key, shown);
  return shown;
}

// Key for things kept per game and tab in the browser (drafts, demo lists). The characters
// tab keeps the plain game id, so drafts and demo lists saved before tabs existed still load.
export const listKey = (game: Game) => (game.category === CATEGORY ? game.id : `${game.id}.${game.category}`);

// Rosters this long get a search box.
export const SEARCH_FROM = 40;

export const DEFAULT_GAME = GAMES[0];

export const gamePath = (g: Game) => (g.id === DEFAULT_GAME.id ? "/" : `/${g.id}`);

// Lowercase, no accents or punctuation, so "rainbow six", "R6" style typing and "pokemon" match.
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Games whose name, short name, id or publisher contains every word typed, in any order,
// limited to one genre when one is picked. Used by the games page search.
export function findGames(games: Game[], query: string, genre: Genre | null = null): Game[] {
  const words = fold(query).split(" ").filter(Boolean);
  return games.filter((g) => {
    if (genre && !g.genres.includes(genre)) return false;
    const hay = fold(`${g.name} ${g.short} ${g.id} ${g.owner}`);
    const squashed = hay.replace(/ /g, "");
    return words.every((w) => hay.includes(w) || squashed.includes(w));
  });
}

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
