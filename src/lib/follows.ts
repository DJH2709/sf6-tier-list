// Following other players. Both sides need a profile (supabase/006_follows.sql).
import { supabase } from "./store";
import { LIST_COLUMNS, PROFILE_COLUMNS, toPublicList, type Profile, type PublicList } from "./profiles";

export type FollowCounts = { followers: number; following: number };

export async function getFollowCounts(id: string): Promise<FollowCounts> {
  if (!supabase) return { followers: 0, following: 0 };
  const count = (column: string) =>
    supabase!.from("follows").select("*", { count: "exact", head: true }).eq(column, id);
  const [followers, following] = await Promise.all([count("followee_id"), count("follower_id")]);
  if (followers.error) throw followers.error;
  if (following.error) throw following.error;
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

export async function isFollowing(me: string, them: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", me)
    .eq("followee_id", them)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function follow(them: string) {
  if (!supabase) return;
  const { error } = await supabase.from("follows").insert({ followee_id: them });
  // Already following (e.g. from another tab) is fine.
  if (error && error.code !== "23505") throw error;
}

export async function unfollow(me: string, them: string) {
  if (!supabase) return;
  const { error } = await supabase.from("follows").delete().eq("follower_id", me).eq("followee_id", them);
  if (error) throw error;
}

export type FollowedPlayer = { profile: Profile; latest: PublicList | null };

// Everyone I follow, newest follow first, each with their most recent public list.
export async function getFollowing(me: string): Promise<FollowedPlayer[]> {
  if (!supabase) return [];
  const { data: rows, error } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", me)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const ids = (rows ?? []).map((r) => r.followee_id as string);
  if (ids.length === 0) return [];

  const [profiles, lists] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids),
    supabase
      .from("tier_lists")
      .select(`user_id, ${LIST_COLUMNS}`)
      .in("user_id", ids)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
  ]);
  if (profiles.error) throw profiles.error;
  if (lists.error) throw lists.error;

  const latest = new Map<string, PublicList>();
  for (const l of lists.data ?? []) if (!latest.has(l.user_id)) latest.set(l.user_id, toPublicList(l));
  const byId = new Map((profiles.data ?? []).map((p) => [p.id, p as Profile]));
  return ids.flatMap((id) => {
    const profile = byId.get(id);
    return profile ? [{ profile, latest: latest.get(id) ?? null }] : [];
  });
}
