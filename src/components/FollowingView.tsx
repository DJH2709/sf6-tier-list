"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFollowing, type FollowedPlayer } from "@/lib/follows";
import { demoMode } from "@/lib/supabase";
import { getGame } from "@/lib/games";
import { gameName } from "@/lib/i18n/games";
import { GameProvider } from "@/components/GameContext";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "@/lib/i18n/config";
import { useAccount } from "@/components/Account";
import SiteHeader from "@/components/SiteHeader";
import PlayerAvatar from "@/components/PlayerAvatar";
import ProfileTag from "@/components/ProfileTag";
import TierRows from "@/components/TierRows";
import LikeButton, { useLikes } from "@/components/LikeButton";
import { VotedAs } from "@/components/RankChip";
import { ERROR } from "@/components/ui";

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
    <div className="mx-auto min-h-dvh max-w-4xl space-y-8 px-4 pb-8 pt-2">
      <SiteHeader account={account} back />
      <main className="space-y-8">
      <h1 className="text-3xl font-medium tracking-tight">{t("following.title")}</h1>
      {demoMode ? (
        <p className="text-ink-300">{t("following.demoOnly")}</p>
      ) : error ? (
        <p className={ERROR}>{error}</p>
      ) : !account.loaded || (me && players === null) ? (
        <p className="text-ink-300">{t("profile.loading")}</p>
      ) : !me ? (
        <p className="text-ink-300">{t("following.signedOut")}</p>
      ) : players!.length === 0 ? (
        <p className="text-ink-300">{t("following.empty")}</p>
      ) : (
        players!.map(({ profile, latest }) => {
          const game = latest ? getGame(latest.game) : undefined;
          return (
            <section key={profile.id} className="space-y-3 border-t border-line pt-6">
              <Link href={`/u/${profile.username}`} className="flex min-h-10 items-center gap-3 hover:underline">
                <PlayerAvatar profile={profile} px={40} className="h-10 w-10 text-sm" />
                <span className="font-medium">{profile.display_name || profile.username}</span>
                <span className="text-sm text-ink-300">@{profile.username}</span>
                <ProfileTag tag={profile.tag} />
              </Link>
              {latest ? (
                <>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-ink-300">
                    <span>
                      {game ? gameName(game, t) : latest.game} · <span className="font-mono text-xs">{t("profile.patch", { patch: latest.patch })}</span> ·{" "}
                      {game ? <VotedAs game={game} rankId={latest.claimed_rank} /> : t("profile.votedAs", { rank: latest.claimed_rank })}
                      {latest.verification === "approved" && <span className="ml-1 text-emerald-300">{t("profile.verified")}</span>}
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
                  <GameProvider id={latest.game}>
                    <TierRows placements={latest.placements} />
                  </GameProvider>
                </>
              ) : (
                <p className="text-sm text-ink-400">{t("following.noList")}</p>
              )}
            </section>
          );
        })
      )}
      </main>
    </div>
  );
}
