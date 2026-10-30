"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createProfile, discordAvatar, getProfileById, signInFresh, signInWithDiscord, signOut, suggestUsername, updateAvatar,
  useSession, type Profile,
} from "@/lib/account";
import { demoMode } from "@/lib/store";

// Supabase sends OAuth errors back in the URL query or hash.
function readAuthError() {
  const params = new URLSearchParams(window.location.search + "&" + window.location.hash.slice(1));
  return params.get("error_description") ?? params.get("error");
}

export function useAccount() {
  const { session, ready } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const signedIn = !!session && !session.user.is_anonymous;

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) {
      setProfile(null);
      setLoaded(true);
      return;
    }
    getProfileById(session!.user.id).then((p) => {
      // Keep the avatar in step with Discord without the player doing anything.
      const avatar = discordAvatar(session!);
      if (p && avatar && p.avatar_url !== avatar) {
        updateAvatar(p.id, avatar);
        p = { ...p, avatar_url: avatar };
      }
      setProfile(p);
      setLoaded(true);
    }, () => setLoaded(true));
  }, [ready, signedIn, session]);

  return { session, signedIn, profile, setProfile, loaded: ready && loaded };
}

export default function AccountBar({ account }: { account: ReturnType<typeof useAccount> }) {
  const [authError, setAuthError] = useState<string | null>(null);
  useEffect(() => setAuthError(readAuthError()), []);

  if (demoMode || !account.loaded) return null;
  const { signedIn, profile } = account;

  return (
    <div className="flex flex-col items-end gap-2 text-sm">
      {signedIn ? (
        <div className="flex items-center gap-3">
          {profile && (
            <Link href={`/u/${profile.username}`} className="flex items-center gap-2 font-semibold text-emerald-300 hover:underline">
              {profile.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element -- Discord CDN, no optimisation needed
                <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full" />
              )}
              @{profile.username}
            </Link>
          )}
          <button onClick={signOut} className="text-neutral-400 hover:text-white">Sign out</button>
        </div>
      ) : (
        <button
          onClick={() => signInWithDiscord().catch((e) => setAuthError(e.message))}
          className="rounded-lg bg-[#5865F2] px-3 py-2 font-semibold text-white hover:bg-[#4752c4]"
        >
          Sign in with Discord
        </button>
      )}
      {authError && (
        <div className="max-w-sm rounded-lg bg-red-950 p-3 text-left text-red-200">
          <p>Sign-in failed: {authError}</p>
          {/already|exists|linked/i.test(authError) && (
            <button onClick={signInFresh} className="mt-2 underline">
              Sign in to that Discord account instead (a vote made without signing in won&apos;t move over)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function PickUsername({ session, onDone }: { session: Session; onDone: (p: Profile) => void }) {
  const [username, setUsername] = useState(suggestUsername(session));
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await createProfile(
        username,
        String(session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? ""),
        discordAvatar(session),
      );
      const p = await getProfileById(session.user.id);
      if (p) onDone(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    }
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
      <p className="font-semibold">Pick a username for your public profile</p>
      <p className="text-sm text-neutral-400">
        Your tier lists will be public at /u/{username || "your-name"}, so friends can see how you voted.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="username"
          className="w-56 rounded-lg border border-neutral-700 bg-neutral-900 p-2.5"
        />
        <button className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-neutral-950 hover:bg-emerald-400">Save</button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
