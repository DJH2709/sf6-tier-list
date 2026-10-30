"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getListsFor, getProfileByUsername, type Profile, type PublicList } from "@/lib/account";
import { demoMode } from "@/lib/store";
import { RANKS } from "@/lib/sf6";
import TierRows from "@/components/TierRows";
import ShareButton from "@/components/ShareButton";

const GAME_NAMES: Record<string, string> = { sf6: "Street Fighter 6" };

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [lists, setLists] = useState<PublicList[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getProfileByUsername(username)
      .then(async (p) => {
        setProfile(p);
        if (p) setLists(await getListsFor(p.id));
      })
      .catch((e) => setError(e.message));
  }, [username]);

  return (
    <div className="mx-auto min-h-screen max-w-5xl space-y-6 px-4 py-8">
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
          <Link href="/" className="text-amber-300 underline">Make your own tier list</Link>
        </div>
      ) : (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black">{profile.display_name || profile.username}</h1>
              <p className="text-neutral-400">@{profile.username}</p>
            </div>
            <ShareButton url={typeof window === "undefined" ? "" : window.location.href} title={`@${profile.username}'s SF6 tier list`} />
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
                </div>
                <TierRows placements={list.placements} />
              </section>
            );
          })}
          <Link href="/" className="inline-block text-sm text-amber-300 underline">Make your own tier list</Link>
        </>
      )}
    </div>
  );
}
