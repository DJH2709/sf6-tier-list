"use client";
import { useEffect, useState } from "react";
import { signInWithDiscord } from "@/lib/account";
import { getMyLikes, like, unlike } from "@/lib/likes";
import type { Profile, PublicList } from "@/lib/profiles";

// Which lists on the page I've liked, and counts that move as I like and unlike.
export function useLikes(lists: PublicList[], me: Profile | null) {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [delta, setDelta] = useState<Record<string, number>>({});
  const ids = lists.map((l) => l.id).join(",");

  useEffect(() => {
    if (me && ids) getMyLikes(me.id, ids.split(",")).then(setLiked, () => {});
    else setLiked(new Set());
  }, [me, ids]);

  return {
    count: (l: PublicList) => l.likes + (delta[l.id] ?? 0),
    isLiked: (l: PublicList) => liked.has(l.id),
    set(l: PublicList, now: boolean) {
      setLiked((s) => {
        const next = new Set(s);
        if (now) next.add(l.id);
        else next.delete(l.id);
        return next;
      });
      setDelta((d) => ({ ...d, [l.id]: (d[l.id] ?? 0) + (now ? 1 : -1) }));
    },
  };
}

type Props = {
  listId: string;
  count: number;
  liked: boolean;
  me: Profile | null;
  signedIn: boolean; // signed in with Discord, maybe without a username yet
  own: boolean;
  onChange: (liked: boolean) => void;
};

// Thumbs up on someone else's list. Your own list shows its count only.
export default function LikeButton({ listId, count, liked, me, signedIn, own, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const label = `👍 ${count}`;

  if (own) return <span className="text-sm text-neutral-400" title="Likes on your list">{label}</span>;

  async function toggle() {
    setError("");
    if (!me && signedIn) {
      setError("Pick a username on the home page to like lists.");
      return;
    }
    if (!me) {
      signInWithDiscord().catch((e) => setError(e.message));
      return;
    }
    setBusy(true);
    try {
      if (liked) await unlike(me.id, listId);
      else await like(listId);
      onChange(!liked);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={liked}
        title={me ? (liked ? "Remove your like" : "Like this list") : "Sign in with Discord to like lists"}
        className={`rounded-full border px-3 py-0.5 text-sm font-semibold disabled:opacity-50 ${liked ? "border-emerald-400 bg-emerald-500/15 text-emerald-300" : "border-neutral-700 text-neutral-300 hover:border-neutral-400"}`}
      >
        {label}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </>
  );
}
