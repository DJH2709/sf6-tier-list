"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { findGames, gamePath, GAMES, GENRES, type Genre } from "@/lib/games";
import { gameName } from "@/lib/i18n/games";
import { useI18n } from "@/lib/i18n/client";
import type { MessageKey } from "@/locales/en";
import { useAccount } from "@/components/Account";
import SiteHeader from "@/components/SiteHeader";
import { INPUT } from "@/components/ui";

// Only genres some game has, so a chip never leads to an empty page.
const USED = GENRES.filter((g) => GAMES.some((game) => game.genres.includes(g)));

// On a card, "Hero shooter" already says "Shooter", so the broader genre is left off there.
// The filter still finds the game under both.
const PARENT: Partial<Record<Genre, Genre>> = { platform: "fighting", anime: "fighting", hero: "shooter", tactical: "shooter", battleroyale: "shooter" };
const cardGenres = (genres: Genre[]) => genres.filter((g) => !genres.some((other) => PARENT[other] === g));

const CHIP = "flex h-8 shrink-0 items-center rounded-md border px-3 text-sm font-medium transition-colors";

// Every game on the site, searchable by name and filterable by genre. The strip of games on
// each game page scrolls sideways; this is where you go once there are too many to scan.
export default function GamesView() {
  const account = useAccount();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<Genre | null>(null);
  const shown = useMemo(() => findGames(GAMES, query, genre), [query, genre]);

  return (
    <div className="mx-auto min-h-dvh max-w-4xl space-y-8 px-4 pb-8 pt-2">
      <SiteHeader account={account} back />
      <main className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-medium tracking-tight">{t("games.title")}</h1>
          <p className="text-ink-300">{t("games.description", { count: GAMES.length })}</p>
        </div>
        <label className="relative block">
          <span className="sr-only">{t("games.search")}</span>
          <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("games.search")}
            autoComplete="off"
            className={`${INPUT} w-full pl-9`}
          />
        </label>
        <div role="group" aria-label={t("games.title")} className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {[null, ...USED].map((g) => (
            <button
              key={g ?? "all"}
              type="button"
              onClick={() => setGenre(g)}
              aria-pressed={genre === g}
              className={`${CHIP} ${genre === g ? "border-ink-400 bg-ink-700 text-ink-100" : "border-line text-ink-300 hover:text-ink-100"}`}
            >
              {g ? t(`genre.${g}` as MessageKey) : t("games.all")}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="text-ink-300">{t("games.none")}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {shown.map((game) => (
              <li key={game.id}>
                <Link href={gamePath(game)} className="flex min-h-16 flex-col justify-center gap-1 rounded-xl border border-line bg-ink-800 px-4 py-3 transition-colors hover:border-line-strong">
                  <span className="font-medium">{gameName(game, t)}</span>
                  <span className="text-sm text-ink-400">
                    {cardGenres(game.genres).map((g) => t(`genre.${g}` as MessageKey)).join(" · ")}
                    {" · "}
                    {t("games.characters", { count: game.characters.length })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
