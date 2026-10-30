"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getListsFor, getProfileByUsername, type Profile, type PublicList } from "@/lib/profiles";
import { demoMode } from "@/lib/store";
import { RANKS } from "@/lib/sf6";
import TierRows from "@/components/TierRows";
import ShareButton from "@/components/ShareButton";
import PlayerAvatar from "@/components/PlayerAvatar";
import ProfileTag from "@/components/ProfileTag";
import FollowBar from "@/components/FollowBar";
import { useAccount } from "@/components/Account";
import LikeButton, { useLikes } from "@/components/LikeButton";

const GAME_NAMES: Record<string, string> = { sf6: "Street Fighter 6" };

export default function ProfileView({ username }: { username: string }) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [lists, setLists] = useState<PublicList[]>([]);
  const [error, setError] = useState("");
  const account = useAccount();
  // The owner also sees lists they've hidden, so they know what others can't see.
  const own = !!profile && account.session?.user.id === profile.id;
  const likes = useLikes(lists, account.profile);

  useEffect(() => {
    getProfileByUsername(username)
      .then(async (p) => {
        setProfile(p);
        if (p) setLists(await getListsFor(p.id));
      })
      .catch((e) => setError(e.message));
  }, [username]);

  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-8 px-4 py-8">
      <Link href="/" className="text-sm font-black tracking-tight">← SF6 TIER LIST</Link>
      {demoMode ? (
        <p className="text-neutral-400">Profiles only work on the live site.</p>
      ) : error ? (
        <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{error}</p>
      ) : profile === undefined ? (
        <p className="text-neutral-400">Loading...</p>
      ) : profile === null ? (
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">No player called @{username}</h1>
          <Link href="/" className="text-emerald-300 underline">Make your own tier list</Link>
        </div>
      ) : (
        <>
          <header className="space-y-4 border-b border-neutral-800 pb-8 text-center">
            <PlayerAvatar profile={profile} className="mx-auto h-20 w-20 text-2xl" />
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {profile.display_name || profile.username} <ProfileTag tag={profile.tag} />
              </h1>
              <p className="text-neutral-400">@{profile.username}</p>
            </div>
            <FollowBar
              profile={profile}
              account={account}
              likes={lists.filter((l) => l.is_public).reduce((n, l) => n + likes.count(l), 0)}
            />
            <div className="flex flex-wrap justify-center gap-3">
              <ShareButton url={typeof window === "undefined" ? "" : window.location.href} title={`@${profile.username}'s SF6 tier list`} />
              <Link href="/" className="rounded-full border border-neutral-600 px-4 py-2 text-sm font-semibold hover:border-neutral-400">
                Make your own
              </Link>
            </div>
          </header>
          {lists.length === 0 && <p className="text-neutral-400">No tier lists yet.</p>}
          {lists.map((list) => {
            const rank = RANKS.find((r) => r.id === list.claimed_rank)?.label ?? list.claimed_rank;
            return (
              <section key={`${list.game}-${list.category}-${list.patch}`} className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-lg font-semibold">
                    {GAME_NAMES[list.game] ?? list.game} · {list.category}
                  </h2>
                  <span className="text-sm text-neutral-400">Patch {list.patch}</span>
                  <span className="text-sm text-neutral-400">
                    Voted as {rank}
                    {list.verification === "approved" ? (
                      <span className="ml-1 font-semibold text-lime-400">✓ verified</span>
                    ) : (
                      <span className="ml-1">(self-reported)</span>
                    )}
                  </span>
                  {list.is_public && (
                    <LikeButton
                      listId={list.id}
                      count={likes.count(list)}
                      liked={likes.isLiked(list)}
                      me={account.profile}
                      signedIn={account.signedIn}
                      own={own}
                      onChange={(now) => likes.set(list, now)}
                    />
                  )}
                  {own && !list.is_public && (
                    <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
                      Hidden from your profile. Only you can see it.
                    </span>
                  )}
                </div>
                <TierRows placements={list.placements} />
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
