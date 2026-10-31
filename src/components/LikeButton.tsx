"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
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

// Thumbs up on someone else's list. On your own list it shows the count, and a tap says why
// you can't like it (phones don't show the title tooltip).
export default function LikeButton({ listId, count, liked, me, signedIn, own, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { t } = useI18n();
  const label = `👍 ${count}`;

  async function toggle() {
    setError("");
    if (own) {
      setError(t("like.ownNote"));
      return;
    }
    if (!me) {
      setError(t(signedIn ? "follow.pickUsername" : "follow.signInToFollow"));
      return;
    }
    setBusy(true);
    try {
      if (liked) await unlike(me.id, listId);
      else await like(listId);
      onChange(!liked);
    } catch (e) {
      console.error(e);
      setError(t("follow.updateFailed"));
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
        title={t(own ? "like.own" : liked ? "like.remove" : "like.add")}
        className={`rounded-full border px-3 py-0.5 text-sm font-semibold disabled:opacity-50 ${own ? "border-neutral-800 text-neutral-400" : liked ? "border-emerald-400 bg-emerald-500/15 text-emerald-300" : "border-neutral-700 text-neutral-300 hover:border-neutral-400"}`}
      >
        {label}
      </button>
      {error && <span className={`text-sm ${own ? "text-neutral-400" : "text-red-400"}`}>{error}</span>}
    </>
  );
}
