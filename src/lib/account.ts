"use client";
import { useEffect, useState } from "react";
import type { Provider, Session } from "@supabase/supabase-js";
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

// Sign-in buttons to show, comma separated, e.g. "discord,google,kakao,x". Only list a provider
// once it's switched on in Supabase (Authentication → Sign In / Providers), or its button fails.
// A custom OAuth provider set up in Supabase is listed as custom:<id>, e.g. custom:line.
export const AUTH_PROVIDERS = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS || "discord")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean) as Provider[];

const LAST_PROVIDER = "sign-in-provider";

// An anonymous voter who signs in keeps the same user id, so their list comes with them.
// That needs "Allow manual linking" on in Supabase.
export async function signInWith(provider: Provider) {
  if (!supabase) throw new Error("Sign-in needs Supabase.");
  sessionStorage.setItem(LAST_PROVIDER, provider);
  const redirectTo = window.location.href;
  const { data } = await supabase.auth.getSession();
  const { error } = data.session?.user.is_anonymous
    ? await supabase.auth.linkIdentity({ provider, options: { redirectTo } })
    : await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  if (error) throw error;
}

// Used when this account (Discord, Google...) already belongs to an older account: drop the
// anonymous session and sign in to that one instead.
export async function signInFresh() {
  if (!supabase) return;
  const provider = (sessionStorage.getItem(LAST_PROVIDER) || AUTH_PROVIDERS[0]) as Provider;
  await supabase.auth.signOut();
  await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
}

export async function signOut() {
  await supabase?.auth.signOut();
}

// Removes the player's sign-in record, which takes their profile, lists, likes and follows
// with it (see supabase/007_delete_account.sql), then clears the session in this browser.
export async function deleteAccount() {
  if (!supabase) throw new Error("Deleting an account needs Supabase.");
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    // The site is ahead of the database: 007 hasn't been run yet.
    if (error.code === "PGRST202") throw new Error("account.deleteNotReady");
    throw error;
  }
  await supabase.auth.signOut();
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
    if (error.code === "23505") throw new Error("error.usernameTaken");
    if (error.code === "23514") throw new Error("error.usernameFormat");
    throw error;
  }
}

export async function updateAvatar(id: string, avatarUrl: string | null) {
  if (!supabase) return;
  await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", id);
}
