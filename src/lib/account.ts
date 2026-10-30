"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./store";

export type { Profile, PublicList } from "./profiles";
import { PROFILE_COLUMNS, type Profile } from "./profiles";

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
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export function suggestUsername(session: Session) {
  const meta = session.user.user_metadata ?? {};
  const raw = String(meta.preferred_username ?? meta.user_name ?? meta.name ?? meta.full_name ?? "");
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
}

// Discord's avatar for this account, if the sign-in gave us one. Only cdn.discordapp.com
// addresses are stored (the database checks this too).
export function discordAvatar(session: Session): string | null {
  const u = session.user.user_metadata?.avatar_url;
  return typeof u === "string" && u.startsWith("https://cdn.discordapp.com/") ? u : null;
}

export async function createProfile(username: string, displayName: string, avatarUrl: string | null) {
  if (!supabase) throw new Error("Profiles need Supabase.");
  const { error } = await supabase
    .from("profiles")
    .insert({ username, display_name: displayName || null, avatar_url: avatarUrl });
  if (error) {
    if (error.code === "23505") throw new Error("That username is taken.");
    if (error.code === "23514") throw new Error("Use 3 to 20 lowercase letters, numbers or underscores.");
    throw error;
  }
}

export async function updateAvatar(id: string, avatarUrl: string | null) {
  if (!supabase) return;
  await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", id);
}
