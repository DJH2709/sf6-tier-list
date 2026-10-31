"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { getPlayers, type PlayerSummary } from "@/lib/players";
import { demoMode } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "@/lib/i18n/config";
import { useAccount } from "@/components/Account";
import SiteHeader from "@/components/SiteHeader";
import PlayerAvatar from "@/components/PlayerAvatar";
import ProfileTag from "@/components/ProfileTag";
import { ERROR, SEGMENT, SEGMENT_ITEM, SEGMENT_OFF, SEGMENT_ON } from "@/components/ui";

type Sort = "liked" | "new";

// Everyone with a profile, so players can find each other to follow and like.
export default function PlayersView() {
  const account = useAccount();
  const { t } = useI18n();
  const [players, setPlayers] = useState<PlayerSummary[] | null>(null);
  const [sort, setSort] = useState<Sort>("liked");
  const [error, setError] = useState("");

  useEffect(() => {
    getPlayers().then(setPlayers, (e) => setError(errorText(e, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t only changes the wording of an error
  }, []);

  const sorted = useMemo(() => {
    const list = [...(players ?? [])];
    // Players with no public list go last: their profile has nothing to see yet.
    return sort === "new"
      ? list.sort((a, b) => Number(b.lists > 0) - Number(a.lists > 0) || b.createdAt.localeCompare(a.createdAt))
      : list.sort((a, b) => Number(b.lists > 0) - Number(a.lists > 0) || b.likes - a.likes || b.followers - a.followers);
  }, [players, sort]);

  return (
    <div className="mx-auto min-h-dvh max-w-4xl space-y-8 px-4 pb-8 pt-2">
      <SiteHeader account={account} back />
      <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-medium tracking-tight">{t("players.title")}</h1>
        <nav className={SEGMENT} aria-label={t("players.title")}>
          {(["liked", "new"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-current={sort === s ? "true" : undefined}
              className={`${SEGMENT_ITEM} ${sort === s ? SEGMENT_ON : SEGMENT_OFF}`}
            >
              {t(s === "liked" ? "players.mostLiked" : "players.newest")}
            </button>
          ))}
        </nav>
      </div>
      {demoMode ? (
        <p className="text-ink-300">{t("profile.demoOnly")}</p>
      ) : error ? (
        <p className={ERROR}>{error}</p>
      ) : players === null ? (
        <p className="text-ink-300">{t("profile.loading")}</p>
      ) : players.length === 0 ? (
        <p className="text-ink-300">{t("players.empty")}</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {sorted.map(({ profile, likes, followers, lists }) => (
            <li key={profile.id}>
              <Link href={`/u/${profile.username}`} className="-mx-2 flex min-h-16 items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-ink-800">
                <PlayerAvatar profile={profile} px={40} className="h-10 w-10 shrink-0 text-sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate font-medium">{profile.display_name || profile.username}</span>
                    <ProfileTag tag={profile.tag} />
                  </span>
                  <span className="block truncate text-sm text-ink-300">@{profile.username}</span>
                </span>
                <span className="shrink-0 space-y-0.5 text-right font-mono text-xs tabular-nums text-ink-300">
                  <span className="flex items-center justify-end gap-1.5"><ThumbsUp size={16} strokeWidth={1.5} className="text-ink-400" aria-hidden />{likes}</span>
                  <span className="block">{t(followers === 1 ? "follow.followersOne" : "follow.followers", { count: followers })}</span>
                  {lists === 0 && <span className="block text-ink-400">{t("players.noLists")}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      </main>
    </div>
  );
}
