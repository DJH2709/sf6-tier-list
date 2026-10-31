"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getListsFor, getProfileByUsername, type Profile, type PublicList } from "@/lib/profiles";
import { demoMode } from "@/lib/supabase";
import { getGame } from "@/lib/games";
import { gameName, rankName } from "@/lib/i18n/games";
import TierRows from "@/components/TierRows";
import ShareButton from "@/components/ShareButton";
import { GameProvider } from "@/components/GameContext";
import PlayerAvatar from "@/components/PlayerAvatar";
import ProfileTag from "@/components/ProfileTag";
import FollowBar from "@/components/FollowBar";
import AccountBar, { useAccount } from "@/components/Account";
import LikeButton, { useLikes } from "@/components/LikeButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "@/lib/i18n/config";
import type { MessageKey } from "@/locales/en";
import { SITE_NAME } from "@/lib/site";

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
    <div className="mx-auto min-h-screen max-w-4xl space-y-8 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <Link href="/" className="shrink-0 whitespace-nowrap pt-1.5 text-sm font-black tracking-tight">← {SITE_NAME}</Link>
        <div className="flex flex-wrap items-start justify-end gap-3">
          <LanguageSwitcher />
          <AccountBar account={account} />
        </div>
      </div>
      {demoMode ? (
        <p className="text-neutral-400">{t("profile.demoOnly")}</p>
      ) : error ? (
        <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{error}</p>
      ) : profile === undefined ? (
        <p className="text-neutral-400">{t("profile.loading")}</p>
      ) : profile === null ? (
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{t("profile.notFound", { username })}</h1>
          <Link href="/" className="text-emerald-300 underline">{t("profile.makeYourOwnList")}</Link>
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
              <ShareButton url={typeof window === "undefined" ? "" : window.location.href} title={t("profile.shareTitle", { username: profile.username })} />
              <Link href="/" className="rounded-full border border-neutral-600 px-4 py-2 text-sm font-semibold hover:border-neutral-400">
                {t("profile.makeYourOwn")}
              </Link>
            </div>
          </header>
          {lists.length === 0 && <p className="text-neutral-400">{t("profile.noLists")}</p>}
          {lists.map((list) => {
            const game = getGame(list.game);
            const rank = game ? rankName(game, list.claimed_rank, t) : list.claimed_rank;
            return (
              <section key={`${list.game}-${list.category}-${list.patch}`} className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-lg font-semibold">
                    {game ? gameName(game, t) : list.game} · {label(`category.${list.category}`)}
                  </h2>
                  <span className="text-sm text-neutral-400">{t("profile.patch", { patch: list.patch })}</span>
                  <span className="text-sm text-neutral-400">
                    {t("profile.votedAs", { rank })}
                    {list.verification === "approved" ? (
                      <span className="ml-1 font-semibold text-lime-400">{t("profile.verified")}</span>
                    ) : (
                      <span className="ml-1">{t("profile.selfReported")}</span>
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
    </div>
  );
}
