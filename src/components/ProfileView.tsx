"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/account";
import { getListsFor, getProfileByUsername, type Profile, type PublicList } from "@/lib/profiles";
import { demoMode } from "@/lib/store";
import { RANKS } from "@/lib/sf6";
import TierRows from "@/components/TierRows";
import ShareButton from "@/components/ShareButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "@/lib/i18n/config";
import type { MessageKey } from "@/locales/en";

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
  const { t } = useI18n();
  // Games and categories added later fall back to their id until they get a string.
  const label = (key: string) => {
    const text = t(key as MessageKey);
    return text === key ? key.split(".").pop()! : text;
  };
  // The owner also sees lists they've hidden, so they know what others can't see.
  const own = !!profile && session?.user.id === profile.id;

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
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm font-black tracking-tight">← {t("site.brand")}</Link>
        <LanguageSwitcher />
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
              <ShareButton url={typeof window === "undefined" ? "" : window.location.href} title={t("profile.shareTitle", { username: profile.username })} />
              <Link href="/" className="rounded-full border border-neutral-600 px-4 py-2 text-sm font-semibold hover:border-neutral-400">
                {t("profile.makeYourOwn")}
              </Link>
            </div>
          </header>
          {lists.length === 0 && <p className="text-neutral-400">{t("profile.noLists")}</p>}
          {lists.map((list) => {
            const rank = RANKS.some((r) => r.id === list.claimed_rank) ? t(`rank.${list.claimed_rank}` as MessageKey) : list.claimed_rank;
            return (
              <section key={`${list.game}-${list.category}-${list.patch}`} className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-lg font-semibold">
                    {label(`game.${list.game}`)} · {label(`category.${list.category}`)}
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
                  {own && !list.is_public && (
                    <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
                      {t("profile.hidden")}
                    </span>
                  )}
                </div>
                <TierRows placements={list.placements} />
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
