"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MakeList from "@/components/MakeList";
import Results, { useResults } from "@/components/Results";
import HeroPreview from "@/components/HeroPreview";
import SiteHeader from "@/components/SiteHeader";
import { configFound, demoMode, missingConfig } from "@/lib/supabase";
import { CATEGORY, DEFAULT_GAME, GAMES, gamePath, getGame, withCategory, type Game } from "@/lib/games";
import { LayoutGrid } from "lucide-react";
import { gameName, rankName } from "@/lib/i18n/games";
import { GameProvider } from "@/components/GameContext";
import { PickUsername, useAccount } from "@/components/Account";
import { useI18n } from "@/lib/i18n/client";
import { BTN_GHOST, BTN_LG, BTN_PRIMARY, NOTE, SEGMENT, SEGMENT_ITEM, SEGMENT_OFF, SEGMENT_ON } from "@/components/ui";
import { FEEDBACK_URL } from "@/lib/site";

const STEPS = [
  { title: "home.step1.title", text: "home.step1.text" },
  { title: "home.step2.title", text: "home.step2.text" },
  { title: "home.step3.title", text: "home.step3.text" },
] as const;

// Game picker. SF6 keeps the home page address so links shared before other games still work.
// "All games" comes first so it is on screen on a phone without scrolling the strip.
function GamePicker({ current }: { current: string }) {
  const { t } = useI18n();
  return (
    <nav aria-label="Games" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none]">
      <Link href="/games" className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-line px-3 text-sm font-medium text-ink-300 transition-colors hover:text-ink-100">
        <LayoutGrid size={14} strokeWidth={1.5} aria-hidden />
        {t("games.link")}
      </Link>
      {GAMES.map((g) => (
        <Link
          key={g.id}
          href={gamePath(g)}
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

// The full roster as plain text, rendered with the page so search engines see which characters
// this list covers before any results load. Always the main roster, whatever tab is open.
function Roster({ game }: { game: Game }) {
  const { t, nameOf } = useI18n();
  return (
    <section aria-labelledby="roster-heading" className="mx-auto max-w-6xl px-4 pb-10">
      <h2 id="roster-heading" className="mb-3 text-sm font-medium text-ink-300">
        {t("home.roster", { game: gameName(game, t), count: game.characters.length })}
      </h2>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-ink-400">
        {game.characters.map((c) => <li key={c.id}>{nameOf(c.id, game)}</li>)}
      </ul>
    </section>
  );
}

export default function GameHome({ gameId }: { gameId: string }) {
  const base = getGame(gameId) ?? DEFAULT_GAME;
  // Which tab of items (characters, weapons...) is being rated. Kept in the address as ?tab= so
  // a link to "Siege weapons" opens on weapons.
  const [category, setCategory] = useState(CATEGORY);
  const game = withCategory(base, category);
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("tab");
    if (wanted && base.tabs.some((t) => t.category === wanted)) setCategory(wanted);
  }, [base]);
  function pickCategory(next: string) {
    setCategory(next);
    setSubmitted(null);
    const url = new URL(window.location.href);
    if (next === CATEGORY) url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }
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
    <GameProvider id={game.id} category={game.category}>
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
              {t("home.title", { game: gameName(game, t) })}
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
        <div className="flex flex-wrap items-center gap-3">
        {game.tabs.length > 1 && (
          <nav className={SEGMENT} aria-label={t("tab.whatToRate")}>
            {game.tabs.map((item) => (
              <button
                key={item.category}
                type="button"
                onClick={() => pickCategory(item.category)}
                aria-current={item.category === game.category ? "page" : undefined}
                className={`${SEGMENT_ITEM} ${item.category === game.category ? SEGMENT_ON : SEGMENT_OFF}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
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
        </div>
        {tab === "results" ? (
          <Results results={community.results} error={community.error} onMakeList={() => setTab("make")} />
        ) : (
          <MakeList
            key={game.category}
            profile={account.profile}
            onSubmitted={(r) => { setRefreshKey((k) => k + 1); setSubmitted(r); setTab("results"); }}
          />
        )}
      </main>

      <Roster game={base} />

      <footer className="border-t border-line px-4 py-8 text-center text-xs leading-5 text-ink-400">
        {t("site.footer", { owner: game.owner })}
        {game.disclaimer && <span className="mt-2 block">{game.disclaimer}</span>}
        {t("site.machineTranslated") && <span className="mt-2 block">{t("site.machineTranslated")}</span>}
        <span className="mt-2 flex justify-center gap-4">
          <Link href="/privacy" className="flex h-6 items-center underline-offset-2 hover:text-ink-100 hover:underline">{t("footer.privacy")}</Link>
          <Link href="/terms" className="flex h-6 items-center underline-offset-2 hover:text-ink-100 hover:underline">{t("footer.terms")}</Link>
          <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className="flex h-6 items-center underline-offset-2 hover:text-ink-100 hover:underline">{t("footer.feedback")}</a>
        </span>
      </footer>
    </div>
    </GameProvider>
  );
}
