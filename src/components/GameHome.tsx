"use client";
import { useState } from "react";
import MakeList from "@/components/MakeList";
import Results from "@/components/Results";
import { configFound, demoMode, missingConfig } from "@/lib/store";
import { DEFAULT_GAME, GAMES, getGame } from "@/lib/games";
import { gameName, rankName } from "@/lib/i18n/games";
import { GameProvider } from "@/components/GameContext";
import Link from "next/link";
import AccountBar, { PickUsername, useAccount } from "@/components/Account";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/client";
import { SITE_NAME } from "@/lib/site";

const STEPS = [
  { title: "home.step1.title", text: "home.step1.text" },
  { title: "home.step2.title", text: "home.step2.text" },
  { title: "home.step3.title", text: "home.step3.text" },
] as const;

// Game picker. SF6 keeps the home page address so links shared before other games still work.
function GamePicker({ current }: { current: string }) {
  return (
    <nav aria-label="Games" className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pt-4 [scrollbar-width:none]">
      {GAMES.map((g) => (
        <Link
          key={g.id}
          href={g.id === DEFAULT_GAME.id ? "/" : `/${g.id}`}
          aria-current={g.id === current ? "page" : undefined}
          title={g.name}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition
            ${g.id === current ? "border-emerald-500 bg-emerald-500 text-neutral-950" : "border-neutral-700 text-neutral-300 hover:border-neutral-500"}`}
        >
          {g.short}
        </Link>
      ))}
    </nav>
  );
}

export default function GameHome({ gameId }: { gameId: string }) {
  const game = getGame(gameId) ?? DEFAULT_GAME;
  const [tab, setTab] = useState<"make" | "results">("results");
  const [refreshKey, setRefreshKey] = useState(0);
  const [submitted, setSubmitted] = useState<{ isPublic: boolean; updated: boolean } | null>(null);
  const account = useAccount();
  const { t } = useI18n();

  function open(next: "make" | "results") {
    setTab(next);
    document.getElementById("app")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <GameProvider id={game.id}>
    <div className="min-h-screen">
      {missingConfig ? (
        <p className="bg-red-900 px-4 py-3 text-sm text-red-100">
          {t("setup.missing")}
          <br />
          NEXT_PUBLIC_SUPABASE_URL: {t(configFound.url ? "setup.found" : "setup.missingValue")}. Supabase key
          (NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY): {t(configFound.key ? "setup.found" : "setup.missingValue")}.
          <br />
          {t("setup.fix")}
        </p>
      ) : (
        demoMode && (
          <p className="bg-emerald-950 px-4 py-2 text-center text-sm text-emerald-300">
            {t("demo.banner")}
          </p>
        )
      )}

      <header className="border-b border-neutral-800 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.16),transparent_60%)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 pt-4">
          <span className="shrink-0 whitespace-nowrap pt-1.5 text-sm font-black tracking-tight">{SITE_NAME}</span>
          <div className="flex flex-wrap items-start justify-end gap-3">
            <LanguageSwitcher />
            <AccountBar account={account} />
          </div>
        </div>
        <GamePicker current={game.id} />
        <div className="mx-auto max-w-3xl space-y-8 px-4 pb-14 pt-12 text-center sm:pb-20 sm:pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
            {t("home.eyebrow", { game: gameName(game, t), patch: game.patch })}
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            {t("home.title")}
          </h1>
          <p className="mx-auto max-w-xl text-lg text-neutral-300">
            {t("home.intro")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => open("make")} className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-neutral-950 hover:bg-emerald-400">
              {t("home.makeCta")}
            </button>
            <button onClick={() => open("results")} className="rounded-full border border-neutral-600 px-6 py-3 font-semibold hover:border-neutral-400">
              {t("home.resultsCta")}
            </button>
          </div>
          <hr className="mx-auto w-16 border-neutral-700" />
          <ol className="grid gap-6 text-left sm:grid-cols-3 sm:text-center">
            {STEPS.map((step, i) => (
              <li key={step.title} className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">{t("home.step", { n: i + 1 })}</span>
                <p className="font-semibold">{t(step.title)}</p>
                <p className="text-sm text-neutral-400">
                  {t(step.text, { first: rankName(game, game.ranks[0].id, t), last: rankName(game, game.ranks[game.ranks.length - 1].id, t) })}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <main id="app" className="mx-auto max-w-5xl scroll-mt-4 space-y-6 px-4 py-10">
        {account.signedIn && account.loaded && !account.profile && account.session && (
          <PickUsername session={account.session} onDone={account.setProfile} />
        )}
        {submitted && account.profile && (
          <p className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-4 text-sm">
            {submitted.isPublic ? (
              <>
                {t("home.onProfile")}{" "}
                <Link href={`/u/${account.profile.username}`} className="font-semibold text-lime-300 underline">
                  {t("home.viewAndShare")}
                </Link>
              </>
            ) : (
              t("home.savedPrivate")
            )}
          </p>
        )}
        {submitted && account.loaded && !account.signedIn && !demoMode && (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300">
            {t(submitted.updated ? "home.updated" : "home.saved")} {t("home.signInToShare")}
          </p>
        )}
        {submitted && demoMode && (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300">
            {t(submitted.updated ? "home.updatedInBrowser" : "home.savedInBrowser")}
          </p>
        )}
        <nav className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-1">
          {(["results", "make"] as const).map((name) => (
            <button
              key={name}
              onClick={() => setTab(name)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${tab === name ? "bg-emerald-500 text-neutral-950" : "text-neutral-300 hover:text-white"}`}
            >
              {t(name === "results" ? "tab.results" : "tab.make")}
            </button>
          ))}
        </nav>
        {tab === "results" ? (
          <Results refreshKey={refreshKey} onMakeList={() => setTab("make")} />
        ) : (
          <MakeList
            profile={account.profile}
            onSubmitted={(r) => { setRefreshKey((k) => k + 1); setSubmitted(r); setTab("results"); }}
          />
        )}
      </main>

      <footer className="border-t border-neutral-800 px-4 py-8 text-center text-xs text-neutral-500">
        {t("site.footer", { owner: game.owner })}
        {t("site.machineTranslated") && <span className="mt-2 block">{t("site.machineTranslated")}</span>}
        <span className="mt-2 block space-x-3">
          <Link href="/privacy" className="underline-offset-2 hover:text-neutral-300 hover:underline">{t("footer.privacy")}</Link>
          <Link href="/terms" className="underline-offset-2 hover:text-neutral-300 hover:underline">{t("footer.terms")}</Link>
        </span>
      </footer>
    </div>
    </GameProvider>
  );
}
