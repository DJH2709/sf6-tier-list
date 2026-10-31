// The Players page: profiles with their like, follower and list counts.
// Counted in the browser, which is fine while the site has hundreds of profiles, not thousands.
import { supabase } from "./supabase";
import { PROFILE_COLUMNS, type Profile } from "./profiles";

export type PlayerSummary = { profile: Profile; createdAt: string; likes: number; followers: number; lists: number };

export async function getPlayers(limit = 100): Promise<PlayerSummary[]> {
  if (!supabase) return [];
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`${PROFILE_COLUMNS}, created_at`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const ids = (profiles ?? []).map((p) => p.id as string);
  if (ids.length === 0) return [];

  const [lists, follows] = await Promise.all([
    supabase.from("tier_lists").select("user_id, list_likes(count)").in("user_id", ids).eq("is_public", true),
    supabase.from("follows").select("followee_id").in("followee_id", ids),
  ]);
  if (lists.error) throw lists.error;
  if (follows.error) throw follows.error;

  const summary = new Map<string, PlayerSummary>(
    (profiles ?? []).map(({ created_at, ...p }) => [
      p.id,
      { profile: p as Profile, createdAt: created_at as string, likes: 0, followers: 0, lists: 0 },
    ]),
  );
  for (const l of lists.data ?? []) {
    const s = summary.get(l.user_id)!;
    s.lists += 1;
    s.likes += (l.list_likes as { count: number }[])[0]?.count ?? 0;
  }
  for (const f of follows.data ?? []) summary.get(f.followee_id)!.followers += 1;
  return [...summary.values()];
}
