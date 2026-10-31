"use client";
import { useState } from "react";
import Link from "next/link";
import MakeList from "@/components/MakeList";
import Results, { useResults } from "@/components/Results";
import HeroPreview from "@/components/HeroPreview";
import SiteHeader from "@/components/SiteHeader";
import { configFound, demoMode, missingConfig } from "@/lib/supabase";
import { DEFAULT_GAME, GAMES, getGame } from "@/lib/games";
import { gameName, rankName } from "@/lib/i18n/games";
import { GameProvider } from "@/components/GameContext";
import { PickUsername, useAccount } from "@/components/Account";
import { useI18n } from "@/lib/i18n/client";
import { BTN_GHOST, BTN_LG, BTN_PRIMARY, NOTE, SEGMENT, SEGMENT_ITEM, SEGMENT_OFF, SEGMENT_ON } from "@/components/ui";

const STEPS = [
  { title: "home.step1.title", text: "home.step1.text" },
  { title: "home.step2.title", text: "home.step2.text" },
  { title: "home.step3.title", text: "home.step3.text" },
] as const;

// Game picker. SF6 keeps the home page address so links shared before other games still work.
function GamePicker({ current }: { current: string }) {
  return (
    <nav aria-label="Games" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none]">
      {GAMES.map((g) => (
        <Link
          key={g.id}
          href={g.id === DEFAULT_GAME.id ? "/" : `/${g.id}`}
          aria-current={g.id === current ? "page" : undefined}
          title={g.name}
          className={`flex h-8 shrink-0 items-center rounded-md px-3 text-sm font-medium transition-colors
            ${g.id === current ? "bg-ink-700 text-ink-100 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]" : "text-ink-300 hover:text-ink-100"}`}
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
  const community = useResults(game, refreshKey);

  function open(next: "make" | "results") {
    setTab(next);
    document.getElementById("app")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <GameProvider id={game.id}>
    <div className="min-h-dvh">
      {missingConfig ? (
        <p className="border-b border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {t("setup.missing")}
          <br />
          NEXT_PUBLIC_SUPABASE_URL: {t(configFound.url ? "setup.found" : "setup.missingValue")}. Supabase key
          (NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY): {t(configFound.key ? "setup.found" : "setup.missingValue")}.
          <br />
          {t("setup.fix")}
        </p>
      ) : (
        demoMode && (
          <p className="border-b border-line bg-ink-800 px-4 py-2 text-center text-sm text-ink-300">
            {t("demo.banner")}
          </p>
        )
      )}

      <div className="border-b border-line">
        <div className="mx-auto max-w-6xl space-y-3 px-4 pt-2">
          <SiteHeader account={account} />
          <GamePicker current={game.id} />
        </div>
        <section aria-labelledby="hero-heading">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-10 sm:pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16">
          <div className="space-y-6">
            <p className="font-mono text-xs text-ink-400">
              {t("home.eyebrow", { game: gameName(game, t), patch: game.patch })}
            </p>
            <h1 id="hero-heading" className="text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              {t("home.title")}
            </h1>
            <p className="max-w-xl text-lg leading-7 text-ink-300">
              {t("home.intro")}
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => open("make")} className={`${BTN_PRIMARY} ${BTN_LG}`}>
                {t("home.makeCta")}
              </button>
              <button type="button" onClick={() => open("results")} className={`${BTN_GHOST} ${BTN_LG}`}>
                {t("home.resultsCta")}
              </button>
            </div>
          </div>
          <HeroPreview results={community.results} />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-10">
          <ol className="grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.title} className="space-y-1">
                <p className="font-medium">{t(step.title)}</p>
                <p className="text-sm leading-5 text-ink-400">
                  {t(step.text, { first: rankName(game, game.ranks[0].id, t), last: rankName(game, game.ranks[game.ranks.length - 1].id, t) })}
                </p>
              </li>
            ))}
          </ol>
        </div>
        </section>
      </div>

      <main id="app" className="mx-auto max-w-6xl scroll-mt-4 space-y-6 px-4 py-10">
        {account.signedIn && account.loaded && !account.profile && account.session && (
          <PickUsername session={account.session} onDone={account.setProfile} />
        )}
        {submitted && account.profile && (
          <p className={NOTE}>
            {submitted.isPublic ? (
              <>
                {t("home.onProfile")}{" "}
                <Link href={`/u/${account.profile.username}`} className="font-medium text-ink-100 underline underline-offset-2">
                  {t("home.viewAndShare")}
                </Link>
              </>
            ) : (
              t("home.savedPrivate")
            )}
          </p>
        )}
        {submitted && account.loaded && !account.signedIn && !demoMode && (
          <p className={NOTE}>
            {t(submitted.updated ? "home.updated" : "home.saved")} {t("home.signInToShare")}
          </p>
        )}
        {submitted && demoMode && (
          <p className={NOTE}>
            {t(submitted.updated ? "home.updatedInBrowser" : "home.savedInBrowser")}
          </p>
        )}
        <nav className={SEGMENT}>
          {(["results", "make"] as const).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              aria-current={tab === name ? "page" : undefined}
              className={`${SEGMENT_ITEM} ${tab === name ? SEGMENT_ON : SEGMENT_OFF}`}
            >
              {t(name === "results" ? "tab.results" : "tab.make")}
            </button>
          ))}
        </nav>
        {tab === "results" ? (
          <Results results={community.results} error={community.error} onMakeList={() => setTab("make")} />
        ) : (
          <MakeList
            profile={account.profile}
            onSubmitted={(r) => { setRefreshKey((k) => k + 1); setSubmitted(r); setTab("results"); }}
          />
        )}
      </main>

      <footer className="border-t border-line px-4 py-8 text-center text-xs leading-5 text-ink-400">
        {t("site.footer", { owner: game.owner })}
        {t("site.machineTranslated") && <span className="mt-2 block">{t("site.machineTranslated")}</span>}
        <span className="mt-2 flex justify-center gap-4">
          <Link href="/privacy" className="flex h-6 items-center underline-offset-2 hover:text-ink-100 hover:underline">{t("footer.privacy")}</Link>
          <Link href="/terms" className="flex h-6 items-center underline-offset-2 hover:text-ink-100 hover:underline">{t("footer.terms")}</Link>
        </span>
      </footer>
    </div>
    </GameProvider>
  );
}
