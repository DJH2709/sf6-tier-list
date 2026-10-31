"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Provider, Session } from "@supabase/supabase-js";
import {
  AUTH_PROVIDERS, createProfile, discordAvatar, getProfileById, signInFresh, signInWith, signOut, suggestUsername, updateAvatar,
  useSession, type Profile,
} from "@/lib/account";
import { demoMode } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/client";
import { errorText, type Locale } from "@/lib/i18n/config";
import { BTN_MD, BTN_PRIMARY, BTN_SECONDARY, ERROR, INPUT, PANEL } from "./ui";

// Button name per sign-in provider. The buttons are all the same quiet style: the one
// bright thing on the page is the "Make your tier list" action, not the sign-in.
const PROVIDER_NAME: Record<string, string> = {
  discord: "Discord", google: "Google", kakao: "Kakao", x: "X", twitter: "X", "custom:line": "LINE",
};

// What most players in each region already have an account with goes first.
const PREFERRED: Record<Locale, string[]> = {
  en: ["discord", "google"],
  es: ["discord", "google"],
  ja: ["x", "twitter", "custom:line", "google"],
  ko: ["kakao", "google"],
  zh: ["google"],
};

function orderFor(locale: Locale): Provider[] {
  const rank = (p: string) => {
    const i = PREFERRED[locale].indexOf(p);
    return i === -1 ? 99 : i;
  };
  return [...AUTH_PROVIDERS].sort((a, b) => rank(a) - rank(b));
}

function providerName(p: string) {
  return PROVIDER_NAME[p] ?? p.replace(/^custom:/, "");
}

function SignInButtons({ onError }: { onError: (message: string) => void }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [first, ...rest] = orderFor(locale);
  const button = (p: Provider) => (
    <button
      key={p}
      type="button"
      onClick={() => signInWith(p).catch((e) => onError(errorText(e, t)))}
      className={`${BTN_SECONDARY} ${BTN_MD}`}
    >
      {t("account.signInWith", { provider: providerName(p) })}
    </button>
  );
  if (!first) return null;
  return (
    <div className="flex flex-col items-end gap-2">
      {button(first)}
      {rest.length > 0 && !open && (
        <button type="button" onClick={() => setOpen(true)} className="flex min-h-6 items-center text-xs text-ink-400 underline-offset-2 hover:text-ink-100 hover:underline">
          {t("account.signInOther")}
        </button>
      )}
      {open && rest.map(button)}
    </div>
  );
}

// Supabase sends OAuth errors back in the URL query or hash.
function readAuthError() {
  const params = new URLSearchParams(window.location.search + "&" + window.location.hash.slice(1));
  return params.get("error_description") ?? params.get("error");
}

export function useAccount() {
  const { session, ready } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const signedIn = !!session && !session.user.is_anonymous;

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) {
      setProfile(null);
      setLoaded(true);
      return;
    }
    getProfileById(session!.user.id).then((p) => {
      // Keep the avatar in step with Discord without the player doing anything.
      const avatar = discordAvatar(session!);
      if (p && avatar && p.avatar_url !== avatar) {
        updateAvatar(p.id, avatar);
        p = { ...p, avatar_url: avatar };
      }
      setProfile(p);
      setLoaded(true);
    }, () => setLoaded(true));
  }, [ready, signedIn, session]);

  return { session, signedIn, profile, setProfile, loaded: ready && loaded };
}

const NAV_LINK = "flex h-9 items-center text-ink-300 transition-colors hover:text-ink-100";

export default function AccountBar({ account }: { account: ReturnType<typeof useAccount> }) {
  const [authError, setAuthError] = useState<string | null>(null);
  const { t } = useI18n();
  useEffect(() => setAuthError(readAuthError()), []);

  if (demoMode) return null;
  // Hold the sign-in button's space while the session loads, so the header doesn't grow and
  // push the page down once it arrives.
  if (!account.loaded) return <div className="h-9 w-40" aria-hidden />;
  const { signedIn, profile } = account;

  const players = <Link href="/players" className={NAV_LINK}>{t("players.link")}</Link>;

  return (
    <div className="flex flex-col items-end gap-2 text-sm">
      {signedIn ? (
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
          {players}
          {profile && (
            <Link href={`/u/${profile.username}`} className="flex h-9 items-center gap-2 font-medium text-ink-100 hover:underline">
              {profile.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element -- Discord CDN, no optimisation needed
                <img src={profile.avatar_url} alt="" width={24} height={24} className="h-6 w-6 rounded-full" />
              )}
              @{profile.username}
            </Link>
          )}
          {profile && <Link href="/following" className={NAV_LINK}>{t("follow.pageLink")}</Link>}
          <button type="button" onClick={signOut} className={NAV_LINK}>{t("account.signOut")}</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-end gap-x-4 gap-y-2">
          {players}
          <SignInButtons onError={setAuthError} />
        </div>
      )}
      {authError && (
        <div className={`${ERROR} max-w-sm text-left`}>
          <p>{t("account.signInFailed", { error: authError })}</p>
          {/already|exists|linked/i.test(authError) && (
            <button type="button" onClick={signInFresh} className="mt-2 flex min-h-6 items-center underline">
              {t("account.signInInstead")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function PickUsername({ session, onDone }: { session: Session; onDone: (p: Profile) => void }) {
  const [username, setUsername] = useState(suggestUsername(session));
  const [error, setError] = useState("");
  const { t } = useI18n();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await createProfile(
        username,
        String(session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? ""),
        discordAvatar(session),
      );
      const p = await getProfileById(session.user.id);
      if (p) onDone(p);
    } catch (err) {
      setError(errorText(err, t, "account.saveFailed"));
    }
  }

  return (
    <form onSubmit={save} className={`${PANEL} space-y-3 p-4`}>
      <p className="font-medium">{t("account.pickTitle")}</p>
      <p className="text-sm leading-5 text-ink-300">{t("account.pickNote", { username: username || "your_name" })}</p>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="username">{t("account.pickTitle")}</label>
        <input
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("account.usernamePlaceholder")}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          required
          className={`${INPUT} w-56`}
        />
        <button className={`${BTN_PRIMARY} ${BTN_MD} h-10`}>{t("account.save")}</button>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </form>
  );
}
