// Public profile reads. No "use client", so server code (page metadata, link preview
// images) can use them as well as the browser.
import { supabase, type Placements } from "./store";

export type Profile = { id: string; username: string; display_name: string | null; avatar_url: string | null };
export type PublicList = {
  game: string;
  category: string;
  patch: string;
  claimed_rank: string;
  verification: string;
  is_public: boolean;
  placements: Placements;
};

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

// A player's lists. Others see only public ones; the owner sees all of theirs.
export async function getListsFor(userId: string): Promise<PublicList[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tier_lists")
    .select("game, category, patch, claimed_rank, verification, is_public, created_at, tier_placements(item_id, score)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    game: l.game,
    category: l.category,
    patch: l.patch,
    claimed_rank: l.claimed_rank,
    verification: l.verification,
    is_public: l.is_public,
    placements: Object.fromEntries(l.tier_placements.map((p: { item_id: string; score: number }) => [p.item_id, p.score])),
  }));
}
