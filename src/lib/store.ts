// Saving lists and reading results. The connection itself is in ./supabase.
import { effectiveBand, CATEGORY, type Band, type Game, type Verification } from "./games";
import { explain, missingConfig, supabase } from "./supabase";

export type Placements = Record<string, number>; // item id -> score 1..5
export type BandResult = { band: Band; item_id: string; avg_score: number; votes: number; lists: number };
export type MyList = {
  id: string;
  patch: string;
  rank: string;
  proofUrl: string | null;
  verification: Verification;
  isPublic: boolean;
  placements: Placements;
};

// One key per game. SF6's is the key used before there were other games.
const demoKey = (game: Game) => `${game.id}-demo-lists`;

// Lists saved before patches were stored have no patch; treat them as the current one.
export type DemoList = { patch?: string; rank: string; placements: Placements; isPublic?: boolean };

function readDemo(game: Game): DemoList[] {
  try {
    return JSON.parse(localStorage.getItem(demoKey(game)) ?? "[]");
  } catch {
    return [];
  }
}

type ListRow = {
  id: string;
  patch: string;
  claimed_rank: string;
  proof_url: string | null;
  verification: Verification;
  is_public: boolean;
  tier_placements: { item_id: string; score: number }[];
};

// Lists this player has submitted for a game, newest first. Empty for someone who has never voted.
export async function getMyLists(game: Game): Promise<MyList[]> {
  if (!supabase) {
    return readDemo(game).map((l, i) => ({
      id: `demo-${i}`,
      patch: l.patch ?? game.patch,
      rank: l.rank,
      proofUrl: null,
      verification: "none",
      isPublic: l.isPublic ?? true,
      placements: l.placements,
    }));
  }
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];
  const { data, error } = await supabase
    .from("tier_lists")
    .select("id, patch, claimed_rank, proof_url, verification, is_public, tier_placements(item_id, score)")
    .eq("user_id", session.session.user.id)
    .eq("game", game.id)
    .eq("category", CATEGORY)
    .order("created_at", { ascending: false });
  if (error) throw explain(error);
  return ((data ?? []) as ListRow[]).map((l) => ({
    id: l.id,
    patch: l.patch,
    rank: l.claimed_rank,
    proofUrl: l.proof_url,
    verification: l.verification,
    isPublic: l.is_public,
    placements: Object.fromEntries(l.tier_placements.map((p) => [p.item_id, p.score])),
  }));
}

// Saves the player's list for the current patch, replacing the one they already have.
// Returns whether an existing list was replaced.
export async function submitList(game: Game, rank: string, placements: Placements, proofUrl?: string, isPublic = true) {
  if (missingConfig) throw new Error("Votes can't be saved: this deployment has no Supabase settings.");
  if (!supabase) {
    // Demo mode keeps one list per patch in this browser, like one per account.
    const others = readDemo(game).filter((l) => (l.patch ?? game.patch) !== game.patch);
    const updated = others.length < readDemo(game).length;
    localStorage.setItem(demoKey(game), JSON.stringify([{ patch: game.patch, rank, placements, isPublic }, ...others]));
    return { updated };
  }
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw explain(error);
  }
  // One database call, so a failed save can't leave the list half replaced.
  const { data: updated, error } = await supabase.rpc("save_list", {
    p_game: game.id,
    p_category: CATEGORY,
    p_patch: game.patch,
    p_rank: rank,
    p_proof_url: proofUrl || null,
    p_is_public: isPublic,
    p_placements: placements,
  });
  if (error) throw error.code === "23505" ? new Error("error.alreadySubmitted") : explain(error);
  return { updated: !!updated };
}

export async function getResults(game: Game): Promise<BandResult[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("band_results")
      .select("band, item_id, avg_score, votes, lists")
      .eq("game", game.id)
      .eq("category", CATEGORY)
      .eq("patch", game.patch);
    if (error) throw explain(error);
    return data as BandResult[];
  }
  return tallyBands(game, readDemo(game));
}

// Demo mode's stand-in for the band_results view: average score per band and character for the
// current patch. tests/band-results.test.mjs checks it against the real view.
export function tallyBands(game: Game, saved: DemoList[]): BandResult[] {
  const totals = new Map<string, BandResult>();
  const lists = saved.filter((l) => (l.patch ?? game.patch) === game.patch);
  for (const list of lists) {
    const band = effectiveBand(game, list.rank, "none");
    for (const [item_id, score] of Object.entries(list.placements)) {
      const k = `${band}:${item_id}`;
      const r = totals.get(k) ?? { band, item_id, avg_score: 0, votes: 0, lists: 0 };
      r.avg_score = (r.avg_score * r.votes + score) / (r.votes + 1);
      r.votes++;
      totals.set(k, r);
    }
  }
  for (const r of totals.values()) r.lists = lists.filter((l) => effectiveBand(game, l.rank, "none") === r.band).length;
  return [...totals.values()];
}
