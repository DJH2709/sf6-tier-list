import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { effectiveBand, GAME, CURRENT_PATCH, RANKS, type Band } from "./sf6";

export type Placements = Record<string, number>; // character id -> score 1..5
export type BandResult = { band: Band; character_id: string; avg_score: number; votes: number; lists: number };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

// Without Supabase settings the site runs in demo mode, saving to this browser only.
export const demoMode = !supabase;
const DEMO_KEY = "sf6-demo-lists";

type DemoList = { rank: string; placements: Placements };

function readDemo(): DemoList[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export async function submitList(rank: string, placements: Placements, proofUrl?: string) {
  const needsProof = RANKS.find((r) => r.id === rank)?.needsProof;
  if (!supabase) {
    // Demo mode keeps one list per browser, like one per account.
    localStorage.setItem(DEMO_KEY, JSON.stringify([{ rank, placements }]));
    return;
  }
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }
  const { data: list, error } = await supabase
    .from("tier_lists")
    .insert({
      game: GAME,
      patch: CURRENT_PATCH,
      claimed_rank: rank,
      verification: needsProof && proofUrl ? "pending" : "none",
      proof_url: proofUrl || null,
    })
    .select("id")
    .single();
  if (error) throw error.code === "23505" ? new Error("You've already submitted a list for this patch.") : error;
  const rows = Object.entries(placements).map(([character_id, score]) => ({ list_id: list.id, character_id, score }));
  const { error: placementError } = await supabase.from("tier_placements").insert(rows);
  if (placementError) throw placementError;
}

export async function getResults(): Promise<BandResult[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("band_results")
      .select("band, character_id, avg_score, votes, lists")
      .eq("game", GAME)
      .eq("patch", CURRENT_PATCH);
    if (error) throw error;
    return data as BandResult[];
  }
  const totals = new Map<string, BandResult>();
  const lists = readDemo();
  for (const list of lists) {
    const band = effectiveBand(list.rank, "none");
    for (const [character_id, score] of Object.entries(list.placements)) {
      const k = `${band}:${character_id}`;
      const r = totals.get(k) ?? { band, character_id, avg_score: 0, votes: 0, lists: 0 };
      r.avg_score = (r.avg_score * r.votes + score) / (r.votes + 1);
      r.votes++;
      totals.set(k, r);
    }
  }
  for (const r of totals.values()) r.lists = lists.filter((l) => effectiveBand(l.rank, "none") === r.band).length;
  return [...totals.values()];
}
