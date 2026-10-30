import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { effectiveBand, GAME, CATEGORY, CURRENT_PATCH, type Band, type Verification } from "./sf6";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase now issues sb_publishable_ keys; its Connect panel names the variable
// ..._PUBLISHABLE_DEFAULT_KEY. Older projects still have an anon key.
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

// Without Supabase settings the site runs in demo mode, saving to this browser only.
export const demoMode = !supabase;
// Shown on the page so a setup problem says which setting the build didn't see.
export const configFound = { url: !!url, key: !!key };
// Vercel sets NEXT_PUBLIC_VERCEL_ENV. A deployed site with no Supabase settings must not
// quietly fall back to demo mode, or votes vanish without anyone noticing.
export const missingConfig = demoMode && !!process.env.NEXT_PUBLIC_VERCEL_ENV;
const DEMO_KEY = "sf6-demo-lists";

// Lists saved before patches were stored have no patch; treat them as the current one.
type DemoList = { patch?: string; rank: string; placements: Placements; isPublic?: boolean };

function readDemo(): DemoList[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// "Failed to fetch" means the browser never reached Supabase: a wrong URL setting,
// a paused project or an ad blocker. Say which address it tried.
function explain(error: { message: string; code?: string }) {
  if (/fetch/i.test(error.message)) {
    return new Error(`Couldn't reach Supabase at ${url}. Check the URL setting in Vercel, and try with ad blockers off.`);
  }
  // Missing column, permission or function: the site is ahead of the database.
  if (error.code === "42703" || error.code === "42501" || error.code === "PGRST202") {
    return new Error("The database is behind the site. Run the latest file in supabase/ in the Supabase SQL editor (see README).");
  }
  return error;
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

// Lists this player has submitted, newest first. Empty for someone who has never voted.
export async function getMyLists(): Promise<MyList[]> {
  if (!supabase) {
    return readDemo().map((l, i) => ({
      id: `demo-${i}`,
      patch: l.patch ?? CURRENT_PATCH,
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
    .eq("game", GAME)
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
export async function submitList(rank: string, placements: Placements, proofUrl?: string, isPublic = true) {
  if (missingConfig) throw new Error("Votes can't be saved: this deployment has no Supabase settings.");
  if (!supabase) {
    // Demo mode keeps one list per patch in this browser, like one per account.
    const others = readDemo().filter((l) => (l.patch ?? CURRENT_PATCH) !== CURRENT_PATCH);
    const updated = others.length < readDemo().length;
    localStorage.setItem(DEMO_KEY, JSON.stringify([{ patch: CURRENT_PATCH, rank, placements, isPublic }, ...others]));
    return { updated };
  }
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw explain(error);
  }
  // One database call, so a failed save can't leave the list half replaced.
  const { data: updated, error } = await supabase.rpc("save_list", {
    p_game: GAME,
    p_category: CATEGORY,
    p_patch: CURRENT_PATCH,
    p_rank: rank,
    p_proof_url: proofUrl || null,
    p_is_public: isPublic,
    p_placements: placements,
  });
  if (error) throw error.code === "23505" ? new Error("You've already submitted a list for this patch. Reload the page to edit it.") : explain(error);
  return { updated: !!updated };
}

export async function getResults(): Promise<BandResult[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("band_results")
      .select("band, item_id, avg_score, votes, lists")
      .eq("game", GAME)
      .eq("category", CATEGORY)
      .eq("patch", CURRENT_PATCH);
    if (error) throw explain(error);
    return data as BandResult[];
  }
  const totals = new Map<string, BandResult>();
  const lists = readDemo().filter((l) => (l.patch ?? CURRENT_PATCH) === CURRENT_PATCH);
  for (const list of lists) {
    const band = effectiveBand(list.rank, "none");
    for (const [item_id, score] of Object.entries(list.placements)) {
      const k = `${band}:${item_id}`;
      const r = totals.get(k) ?? { band, item_id, avg_score: 0, votes: 0, lists: 0 };
      r.avg_score = (r.avg_score * r.votes + score) / (r.votes + 1);
      r.votes++;
      totals.set(k, r);
    }
  }
  for (const r of totals.values()) r.lists = lists.filter((l) => effectiveBand(l.rank, "none") === r.band).length;
  return [...totals.values()];
}
