"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFollowing, type FollowedPlayer } from "@/lib/follows";
import { demoMode } from "@/lib/store";
import { RANKS } from "@/lib/sf6";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "@/lib/i18n/config";
import type { MessageKey } from "@/locales/en";
import AccountBar, { useAccount } from "@/components/Account";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
  const { t } = useI18n();
  const likes = useLikes(players?.flatMap((p) => (p.latest ? [p.latest] : [])) ?? [], me);

  useEffect(() => {
    if (me) getFollowing(me.id).then(setPlayers, (e) => setError(errorText(e, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t only changes the wording of an error
  }, [me]);

  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-8 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <Link href="/" className="pt-1.5 text-sm font-black tracking-tight">← {t("site.brand")}</Link>
        <div className="flex flex-wrap items-start justify-end gap-3">
          <LanguageSwitcher />
          <AccountBar account={account} />
        </div>
      </div>
      <h1 className="text-3xl font-black tracking-tight">{t("following.title")}</h1>
      {demoMode ? (
        <p className="text-neutral-400">{t("following.demoOnly")}</p>
      ) : error ? (
        <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{error}</p>
      ) : !account.loaded || (me && players === null) ? (
        <p className="text-neutral-400">{t("profile.loading")}</p>
      ) : !me ? (
        <p className="text-neutral-400">{t("following.signedOut")}</p>
      ) : players!.length === 0 ? (
        <p className="text-neutral-400">{t("following.empty")}</p>
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
                    {t("profile.patch", { patch: latest.patch })} ·{" "}
                    {t("profile.votedAs", {
                      rank: RANKS.some((r) => r.id === latest.claimed_rank) ? t(`rank.${latest.claimed_rank}` as MessageKey) : latest.claimed_rank,
                    })}
                    {latest.verification === "approved" && <span className="ml-1 font-semibold text-lime-400">{t("profile.verified")}</span>}
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
              <p className="text-sm text-neutral-500">{t("following.noList")}</p>
            )}
          </section>
        ))
      )}
    </div>
  );
}
