"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getPlayers, type PlayerSummary } from "@/lib/players";
import { demoMode } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "@/lib/i18n/config";
import AccountBar, { useAccount } from "@/components/Account";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PlayerAvatar from "@/components/PlayerAvatar";
import ProfileTag from "@/components/ProfileTag";

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
    <div className="mx-auto min-h-screen max-w-4xl space-y-8 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <Link href="/" className="shrink-0 whitespace-nowrap pt-1.5 text-sm font-black tracking-tight">← {t("site.brand")}</Link>
        <div className="flex flex-wrap items-start justify-end gap-3">
          <LanguageSwitcher />
          <AccountBar account={account} />
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight">{t("players.title")}</h1>
        <nav className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-1">
          {(["liked", "new"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${sort === s ? "bg-emerald-500 text-neutral-950" : "text-neutral-300 hover:text-white"}`}
            >
              {t(s === "liked" ? "players.mostLiked" : "players.newest")}
            </button>
          ))}
        </nav>
      </div>
      {demoMode ? (
        <p className="text-neutral-400">{t("profile.demoOnly")}</p>
      ) : error ? (
        <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{error}</p>
      ) : players === null ? (
        <p className="text-neutral-400">{t("profile.loading")}</p>
      ) : players.length === 0 ? (
        <p className="text-neutral-400">{t("players.empty")}</p>
      ) : (
        <ul className="divide-y divide-neutral-800 border-y border-neutral-800">
          {sorted.map(({ profile, likes, followers, lists }) => (
            <li key={profile.id}>
              <Link href={`/u/${profile.username}`} className="flex items-center gap-3 py-3 hover:bg-neutral-900/60">
                <PlayerAvatar profile={profile} className="h-10 w-10 shrink-0 text-sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate font-semibold">{profile.display_name || profile.username}</span>
                    <ProfileTag tag={profile.tag} />
                  </span>
                  <span className="block truncate text-sm text-neutral-400">@{profile.username}</span>
                </span>
                <span className="shrink-0 text-right text-xs text-neutral-400 sm:text-sm">
                  <span className="block">👍 {likes}</span>
                  <span className="block">{t(followers === 1 ? "follow.followersOne" : "follow.followers", { count: followers })}</span>
                  {lists === 0 && <span className="block text-neutral-500">{t("players.noLists")}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
