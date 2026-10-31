// Public profile reads. No "use client", so server code (page metadata, link preview
// images) can use them as well as the browser.
import { supabase } from "./supabase";
import type { Placements } from "./store";

// Tags are set by the site owner in Supabase, never by the player.
export type ProfileTag = "pro" | "influencer";
export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  tag: ProfileTag | null;
};
export const PROFILE_COLUMNS = "id, username, display_name, avatar_url, tag";
export type PublicList = {
  id: string;
  game: string;
  category: string;
  patch: string;
  claimed_rank: string;
  verification: string;
  is_public: boolean;
  placements: Placements;
  likes: number;
};

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
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
    .select(LIST_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toPublicList);
}

export const LIST_COLUMNS =
  "id, game, category, patch, claimed_rank, verification, is_public, created_at, tier_placements(item_id, score), list_likes(count)";

type ListRow = Omit<PublicList, "placements" | "likes"> & {
  tier_placements: { item_id: string; score: number }[];
  list_likes: { count: number }[];
};
export function toPublicList(l: ListRow): PublicList {
  return {
    id: l.id,
    game: l.game,
    category: l.category,
    patch: l.patch,
    claimed_rank: l.claimed_rank,
    verification: l.verification,
    is_public: l.is_public,
    placements: Object.fromEntries(l.tier_placements.map((p) => [p.item_id, p.score])),
    likes: l.list_likes[0]?.count ?? 0,
  };
}
