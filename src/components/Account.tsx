"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Provider, Session } from "@supabase/supabase-js";
import {
  AUTH_PROVIDERS, createProfile, discordAvatar, getProfileById, signInFresh, signInWith, signOut, suggestUsername, updateAvatar,
  useSession, type Profile,
} from "@/lib/account";
import { demoMode } from "@/lib/store";
import { useI18n } from "@/lib/i18n/client";
import { errorText, type Locale } from "@/lib/i18n/config";

// Button name and brand colour per sign-in provider. Unknown providers get a plain button.
const PROVIDER_STYLE: Record<string, { name: string; className: string }> = {
  discord: { name: "Discord", className: "bg-[#5865F2] text-white hover:bg-[#4752c4]" },
  google: { name: "Google", className: "bg-white text-neutral-900 hover:bg-neutral-200" },
  kakao: { name: "Kakao", className: "bg-[#FEE500] text-black/85 hover:bg-[#e6cf00]" },
  x: { name: "X", className: "bg-black text-white ring-1 ring-neutral-700 hover:bg-neutral-900" },
  twitter: { name: "X", className: "bg-black text-white ring-1 ring-neutral-700 hover:bg-neutral-900" },
  "custom:line": { name: "LINE", className: "bg-[#06C755] text-white hover:bg-[#05b14c]" },
};

// What most players in each region already have an account with goes first.
const PREFERRED: Record<Locale, string[]> = {
  en: ["discord", "google"],
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
  return PROVIDER_STYLE[p]?.name ?? p.replace(/^custom:/, "");
}

function SignInButtons({ onError }: { onError: (message: string) => void }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [first, ...rest] = orderFor(locale);
  const button = (p: Provider) => (
    <button
      key={p}
      onClick={() => signInWith(p).catch((e) => onError(errorText(e, t)))}
      className={`whitespace-nowrap rounded-lg px-3 py-2 font-semibold ${PROVIDER_STYLE[p]?.className ?? "bg-neutral-200 text-neutral-900"}`}
    >
      {t("account.signInWith", { provider: providerName(p) })}
    </button>
  );
  if (!first) return null;
  return (
    <div className="flex flex-col items-end gap-2">
      {button(first)}
      {rest.length > 0 && !open && (
        <button onClick={() => setOpen(true)} className="text-xs text-neutral-400 underline-offset-2 hover:underline">
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

export default function AccountBar({ account }: { account: ReturnType<typeof useAccount> }) {
  const [authError, setAuthError] = useState<string | null>(null);
  const { t } = useI18n();
  useEffect(() => setAuthError(readAuthError()), []);

  if (demoMode || !account.loaded) return null;
  const { signedIn, profile } = account;

  return (
    <div className="flex flex-col items-end gap-2 text-sm">
      {signedIn ? (
        <div className="flex items-center gap-3">
          {profile && (
            <Link href={`/u/${profile.username}`} className="flex items-center gap-2 font-semibold text-emerald-300 hover:underline">
              {profile.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element -- Discord CDN, no optimisation needed
                <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full" />
              )}
              @{profile.username}
            </Link>
          )}
          <button onClick={signOut} className="text-neutral-400 hover:text-white">{t("account.signOut")}</button>
        </div>
      ) : (
        <SignInButtons onError={setAuthError} />
      )}
      {authError && (
        <div className="max-w-sm rounded-lg bg-red-950 p-3 text-left text-red-200">
          <p>{t("account.signInFailed", { error: authError })}</p>
          {/already|exists|linked/i.test(authError) && (
            <button onClick={signInFresh} className="mt-2 underline">
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
    <form onSubmit={save} className="space-y-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
      <p className="font-semibold">{t("account.pickTitle")}</p>
      <p className="text-sm text-neutral-400">{t("account.pickNote", { username: username || "your-name" })}</p>
      <div className="flex flex-wrap gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder={t("account.usernamePlaceholder")}
          className="w-56 rounded-lg border border-neutral-700 bg-neutral-900 p-2.5"
        />
        <button className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-neutral-950 hover:bg-emerald-400">{t("account.save")}</button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
