"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFollowing, type FollowedPlayer } from "@/lib/follows";
import { demoMode } from "@/lib/store";
import { RANKS } from "@/lib/sf6";
import { useAccount } from "@/components/Account";
import PlayerAvatar from "@/components/PlayerAvatar";
import ProfileTag from "@/components/ProfileTag";
import TierRows from "@/components/TierRows";
import LikeButton, { useLikes } from "@/components/LikeButton";

// The latest public list from each player you follow.
export default function FollowingView() {
  const account = useAccount();
  const [players, setPlayers] = useState<FollowedPlayer[] | null>(null);
  const [error, setError] = useState("");
  const me = account.profile;
  const likes = useLikes(players?.flatMap((p) => (p.latest ? [p.latest] : [])) ?? [], me);

  useEffect(() => {
    if (me) getFollowing(me.id).then(setPlayers, (e) => setError(e.message));
  }, [me]);

  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-8 px-4 py-8">
      <Link href="/" className="text-sm font-black tracking-tight">← SF6 TIER LIST</Link>
      <h1 className="text-3xl font-black tracking-tight">Following</h1>
      {demoMode ? (
        <p className="text-neutral-400">Following only works on the live site.</p>
      ) : error ? (
        <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{error}</p>
      ) : !account.loaded || (me && players === null) ? (
        <p className="text-neutral-400">Loading...</p>
      ) : !me ? (
        <p className="text-neutral-400">
          Sign in with Discord and pick a username on the{" "}
          <Link href="/" className="text-emerald-300 underline">home page</Link> to follow players.
        </p>
      ) : players!.length === 0 ? (
        <p className="text-neutral-400">
          You don&apos;t follow anyone yet. Open a player&apos;s profile and press Follow to see their lists here.
        </p>
      ) : (
        players!.map(({ profile, latest }) => (
          <section key={profile.id} className="space-y-3 border-t border-neutral-800 pt-6">
            <Link href={`/u/${profile.username}`} className="flex items-center gap-3 hover:underline">
              <PlayerAvatar profile={profile} className="h-10 w-10 text-sm" />
              <span className="font-semibold">{profile.display_name || profile.username}</span>
              <span className="text-sm text-neutral-400">@{profile.username}</span>
              <ProfileTag tag={profile.tag} />
            </Link>
            {latest ? (
              <>
                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                  <span>
                    Patch {latest.patch} · voted as {RANKS.find((r) => r.id === latest.claimed_rank)?.label ?? latest.claimed_rank}
                    {latest.verification === "approved" && <span className="ml-1 font-semibold text-lime-400">✓ verified</span>}
                  </span>
                  <LikeButton
                    listId={latest.id}
                    count={likes.count(latest)}
                    liked={likes.isLiked(latest)}
                    me={me}
                    signedIn={account.signedIn}
                    own={false}
                    onChange={(now) => likes.set(latest, now)}
                  />
                </div>
                <TierRows placements={latest.placements} />
              </>
            ) : (
              <p className="text-sm text-neutral-500">No public tier list yet.</p>
            )}
          </section>
        ))
      )}
    </div>
  );
}
