"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { follow, getFollowCounts, isFollowing, unfollow, type FollowCounts } from "@/lib/follows";
import type { Profile } from "@/lib/profiles";
import type { useAccount } from "./Account";
import { BTN_GHOST, BTN_MD, BTN_SECONDARY } from "./ui";

type Props = { profile: Profile; account: ReturnType<typeof useAccount>; likes: number };

// Follower counts and the Follow button on a profile. Following needs a profile of your own.
export default function FollowBar({ profile, account, likes }: Props) {
  const [counts, setCounts] = useState<FollowCounts | null>(null);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { t } = useI18n();
  const me = account.profile;
  const own = me?.id === profile.id;

  useEffect(() => {
    getFollowCounts(profile.id).then(setCounts, () => setCounts(null));
  }, [profile.id]);

  useEffect(() => {
    if (me && !own) isFollowing(me.id, profile.id).then(setFollowing, () => {});
  }, [me, own, profile.id]);

  async function toggle() {
    if (!me) return;
    setBusy(true);
    setError("");
    try {
      if (following) await unfollow(me.id, profile.id);
      else await follow(profile.id);
      setFollowing(!following);
      setCounts((c) => c && { ...c, followers: c.followers + (following ? -1 : 1) });
    } catch (e) {
      console.error(e);
      setError(t("follow.updateFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {counts && (
        <p className="text-sm tabular-nums text-ink-300">
          {t(counts.followers === 1 ? "follow.followersOne" : "follow.followers", { count: counts.followers })}
          {" · "}
          {t("follow.following", { count: counts.following })}
          {" · "}
          {t(likes === 1 ? "follow.likesOne" : "follow.likes", { count: likes })}
        </p>
      )}
      {account.loaded && !own && (
        me ? (
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className={`${following ? `${BTN_GHOST} hover:border-red-400/60 hover:text-red-300` : BTN_SECONDARY} ${BTN_MD}`}
          >
            {t(following ? "follow.followingButton" : "follow.follow")}
          </button>
        ) : account.signedIn ? (
          <Link href="/" className="inline-flex min-h-6 items-center text-sm text-ink-100 underline underline-offset-2">{t("follow.pickUsername")}</Link>
        ) : (
          <p className="text-sm text-ink-300">{t("follow.signInToFollow")}</p>
        )
      )}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
