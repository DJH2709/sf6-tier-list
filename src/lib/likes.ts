// Likes on other players' public lists, one per player per list (supabase/006_follows_likes.sql).
import { supabase } from "./supabase";

// Which of these lists I've liked.
export async function getMyLikes(me: string, listIds: string[]): Promise<Set<string>> {
  if (!supabase || listIds.length === 0) return new Set();
  const { data, error } = await supabase.from("list_likes").select("list_id").eq("user_id", me).in("list_id", listIds);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.list_id as string));
}

export async function like(listId: string) {
  if (!supabase) return;
  const { error } = await supabase.from("list_likes").insert({ list_id: listId });
  // Already liked (e.g. from another tab) is fine.
  if (error && error.code !== "23505") throw error;
}

export async function unlike(me: string, listId: string) {
  if (!supabase) return;
  const { error } = await supabase.from("list_likes").delete().eq("user_id", me).eq("list_id", listId);
  if (error) throw error;
}
