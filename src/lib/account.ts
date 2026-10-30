"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./store";
import type { Placements } from "./store";

export type Profile = { id: string; username: string; display_name: string | null };
export type PublicList = {
  game: string;
  category: string;
  patch: string;
  claimed_rank: string;
  verification: string;
  placements: Placements;
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

// An anonymous voter who signs in keeps the same user id, so their list comes with them.
// That needs "Allow manual linking" on in Supabase.
export async function signInWithDiscord() {
  if (!supabase) throw new Error("Sign-in needs Supabase.");
  const redirectTo = window.location.href;
  const { data } = await supabase.auth.getSession();
  const { error } = data.session?.user.is_anonymous
    ? await supabase.auth.linkIdentity({ provider: "discord", options: { redirectTo } })
    : await supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo } });
  if (error) throw error;
}

// Used when this Discord account already belongs to an older account: drop the
// anonymous session and sign in to that one instead.
export async function signInFresh() {
  if (!supabase) return;
  await supabase.auth.signOut();
  await supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo: window.location.origin } });
}

export async function signOut() {
  await supabase?.auth.signOut();
}

export async function getProfileById(id: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("id, username, display_name").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function suggestUsername(session: Session) {
  const meta = session.user.user_metadata ?? {};
  const raw = String(meta.preferred_username ?? meta.user_name ?? meta.name ?? meta.full_name ?? "");
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
}

export async function createProfile(username: string, displayName: string) {
  if (!supabase) throw new Error("Profiles need Supabase.");
  const { error } = await supabase.from("profiles").insert({ username, display_name: displayName || null });
  if (error) {
    if (error.code === "23505") throw new Error("That username is taken.");
    if (error.code === "23514") throw new Error("Use 3 to 20 lowercase letters, numbers or underscores.");
    throw error;
  }
}

export async function getListsFor(userId: string): Promise<PublicList[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tier_lists")
    .select("game, category, patch, claimed_rank, verification, created_at, tier_placements(item_id, score)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    game: l.game,
    category: l.category,
    patch: l.patch,
    claimed_rank: l.claimed_rank,
    verification: l.verification,
    placements: Object.fromEntries(l.tier_placements.map((p: { item_id: string; score: number }) => [p.item_id, p.score])),
  }));
}
