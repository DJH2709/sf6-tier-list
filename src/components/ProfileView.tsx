"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/account";
import { getListsFor, getProfileByUsername, type Profile, type PublicList } from "@/lib/profiles";
import { demoMode } from "@/lib/store";
import { getGame } from "@/lib/games";
import TierRows from "@/components/TierRows";
import ShareButton from "@/components/ShareButton";
import { GameProvider } from "@/components/GameContext";

// Stable colour per username, matching the character badges.
function avatarColour(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${hash} 45% 35%)`;
}

export default function ProfileView({ username }: { username: string }) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [lists, setLists] = useState<PublicList[]>([]);
  const [error, setError] = useState("");
  const { session } = useSession();
  // The owner also sees lists they've hidden, so they know what others can't see.
  const own = !!profile && session?.user.id === profile.id;

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
      <Link href="/" className="text-sm font-black tracking-tight">← TIER LISTS</Link>
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
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- Discord CDN, no optimisation needed
              <img src={profile.avatar_url} alt="" className="mx-auto h-20 w-20 rounded-full object-cover" />
            ) : (
              <span
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white"
                style={{ backgroundColor: avatarColour(profile.username) }}
                aria-hidden
              >
                {(profile.display_name || profile.username).slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <h1 className="text-3xl font-black tracking-tight">{profile.display_name || profile.username}</h1>
              <p className="text-neutral-400">@{profile.username}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <ShareButton url={typeof window === "undefined" ? "" : window.location.href} title={`@${profile.username}'s tier lists`} />
              <Link href="/" className="rounded-full border border-neutral-600 px-4 py-2 text-sm font-semibold hover:border-neutral-400">
                Make your own
              </Link>
            </div>
          </header>
          {lists.length === 0 && <p className="text-neutral-400">No tier lists yet.</p>}
          {lists.map((list) => {
            const game = getGame(list.game);
            const rank = game?.ranks.find((r) => r.id === list.claimed_rank)?.label ?? list.claimed_rank;
            return (
              <section key={`${list.game}-${list.category}-${list.patch}`} className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-lg font-semibold">
                    {game?.name ?? list.game} · {list.category}
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
                  {own && !list.is_public && (
                    <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
                      Hidden from your profile. Only you can see it.
                    </span>
                  )}
                </div>
                <GameProvider id={list.game}>
                  <TierRows placements={list.placements} />
                </GameProvider>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
