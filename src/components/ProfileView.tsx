"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getListsFor, getProfileByUsername, type Profile, type PublicList } from "@/lib/profiles";
import { demoMode } from "@/lib/supabase";
import { getGame } from "@/lib/games";
import { gameName } from "@/lib/i18n/games";
import TierRows from "@/components/TierRows";
import ShareButton from "@/components/ShareButton";
import { GameProvider } from "@/components/GameContext";
import PlayerAvatar from "@/components/PlayerAvatar";
import ProfileTag from "@/components/ProfileTag";
import FollowBar from "@/components/FollowBar";
import SiteHeader from "@/components/SiteHeader";
import { useAccount } from "@/components/Account";
import LikeButton, { useLikes } from "@/components/LikeButton";
import { VotedAs } from "@/components/RankChip";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "@/lib/i18n/config";
import type { MessageKey } from "@/locales/en";
import { BTN_MD, BTN_PRIMARY, ERROR } from "@/components/ui";

export default function ProfileView({ username }: { username: string }) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [lists, setLists] = useState<PublicList[]>([]);
  const [error, setError] = useState("");
  const account = useAccount();
  const { t } = useI18n();
  // Categories added later fall back to their id until they get a string.
  const label = (key: string) => {
    const text = t(key as MessageKey);
    return text === key ? key.split(".").pop()! : text;
  };
  // The owner also sees lists they've hidden, so they know what others can't see.
  const own = !!profile && account.session?.user.id === profile.id;
  const likes = useLikes(lists, account.profile);

  useEffect(() => {
    getProfileByUsername(username)
      .then(async (p) => {
        setProfile(p);
        if (p) setLists(await getListsFor(p.id));
      })
      .catch((e) => setError(errorText(e, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t only changes the wording of an error
  }, [username]);

  return (
    <div className="mx-auto min-h-dvh max-w-4xl space-y-8 px-4 pb-8 pt-2">
      <SiteHeader account={account} back />
      <main className="space-y-8">
      {demoMode ? (
        <p className="text-ink-300">{t("profile.demoOnly")}</p>
      ) : error ? (
        <p className={ERROR}>{error}</p>
      ) : profile === undefined ? (
        <p className="text-ink-300">{t("profile.loading")}</p>
      ) : profile === null ? (
        <div className="space-y-3">
          <h1 className="text-2xl font-medium tracking-tight">{t("profile.notFound", { username })}</h1>
          <Link href="/" className="inline-flex min-h-6 items-center text-ink-100 underline underline-offset-2">{t("profile.makeYourOwnList")}</Link>
        </div>
      ) : (
        <>
          <header className="space-y-4 border-b border-line pb-8 text-center">
            <PlayerAvatar profile={profile} px={80} className="mx-auto h-20 w-20 text-2xl" />
            <div className="space-y-1">
              <h1 className="text-3xl font-medium tracking-tight">
                {profile.display_name || profile.username} <ProfileTag tag={profile.tag} />
              </h1>
              <p className="text-ink-300">@{profile.username}</p>
            </div>
            <FollowBar
              profile={profile}
              account={account}
              likes={lists.filter((l) => l.is_public).reduce((n, l) => n + likes.count(l), 0)}
            />
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/" className={`${BTN_PRIMARY} ${BTN_MD}`}>
                {t("profile.makeYourOwn")}
              </Link>
              <ShareButton url={typeof window === "undefined" ? "" : window.location.href} title={t("profile.shareTitle", { username: profile.username })} />
            </div>
          </header>
          {lists.length === 0 && <p className="text-ink-300">{t("profile.noLists")}</p>}
          {lists.map((list) => {
            const game = getGame(list.game);
            return (
              <section key={`${list.game}-${list.category}-${list.patch}`} className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="text-lg font-medium">
                    {game ? gameName(game, t) : list.game} · {label(`category.${list.category}`)}
                  </h2>
                  <span className="font-mono text-xs text-ink-300">{t("profile.patch", { patch: list.patch })}</span>
                  <span className="text-sm text-ink-300">
                    {game ? <VotedAs game={game} rankId={list.claimed_rank} /> : t("profile.votedAs", { rank: list.claimed_rank })}
                    {list.verification === "approved" ? (
                      <span className="ml-1 text-emerald-300">{t("profile.verified")}</span>
                    ) : (
                      <span className="ml-1 text-ink-400">{t("profile.selfReported")}</span>
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
                    <span className="inline-flex h-5 items-center rounded border border-line-strong px-1.5 font-mono text-[11px] text-ink-300">
                      {t("profile.hidden")}
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
      </main>
    </div>
  );
}
