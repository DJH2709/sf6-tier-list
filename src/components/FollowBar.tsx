"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signInWithDiscord } from "@/lib/account";
import { follow, getFollowCounts, isFollowing, unfollow, type FollowCounts } from "@/lib/follows";
import type { Profile } from "@/lib/profiles";
import type { useAccount } from "./Account";

type Props = { profile: Profile; account: ReturnType<typeof useAccount>; likes: number };

// Follower counts and the Follow button on a profile. Following needs a profile of your own.
export default function FollowBar({ profile, account, likes }: Props) {
  const [counts, setCounts] = useState<FollowCounts | null>(null);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const me = account.profile;
  const own = me?.id === profile.id;

  useEffect(() => {
    getFollowCounts(profile.id).then(setCounts, () => setCounts(null));
  }, [profile.id]);

  useEffect(() => {
    if (me && !own) isFollowing(me.id, profile.id).then(setFollowing, () => {});
  }, [me, own, profile.id]);

  async function toggle() {
    if (!me) return;
    setBusy(true);
    setError("");
    try {
      if (following) await unfollow(me.id, profile.id);
      else await follow(profile.id);
      setFollowing(!following);
      setCounts((c) => c && { ...c, followers: c.followers + (following ? -1 : 1) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update.");
    } finally {
      setBusy(false);
    }
  }

  const button = "rounded-full px-5 py-2 text-sm font-semibold";
  return (
    <div className="space-y-3">
      {counts && (
        <p className="text-sm text-neutral-400">
          <span className="font-semibold text-white">{counts.followers}</span> {counts.followers === 1 ? "follower" : "followers"}
          {" · "}
          <span className="font-semibold text-white">{counts.following}</span> following
          {" · "}
          <span className="font-semibold text-white">{likes}</span> {likes === 1 ? "like" : "likes"}
        </p>
      )}
      {account.loaded && !own && (
        me ? (
          <button
            onClick={toggle}
            disabled={busy}
            className={`${button} ${following ? "border border-neutral-600 hover:border-red-400 hover:text-red-300" : "bg-white text-neutral-950 hover:bg-neutral-200"} disabled:opacity-50`}
          >
            {following ? "Following" : "Follow"}
          </button>
        ) : account.signedIn ? (
          <Link href="/" className="text-sm text-emerald-300 underline">Pick a username to follow players</Link>
        ) : (
          <button onClick={() => signInWithDiscord().catch((e) => setError(e.message))} className={`${button} bg-white text-neutral-950 hover:bg-neutral-200`}>
            Sign in to follow
          </button>
        )
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
