"use client";
import { useEffect, useState } from "react";
import { bandsFor, MIN_LISTS, type Band, type Game } from "@/lib/games";
import { getResults, type BandResult } from "@/lib/store";
import TierRows from "./TierRows";
import RankChip from "./RankChip";
import { useGame } from "./GameContext";
import { bandRanks } from "@/lib/i18n/games";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "@/lib/i18n/config";
import type { MessageKey } from "@/locales/en";
import { BTN_MD, BTN_PRIMARY, ERROR, PANEL } from "./ui";

// The community averages for a game, fetched once and shared by the hero preview and the results tab.
export function useResults(game: Game, refreshKey: number) {
  const { t } = useI18n();
  const [results, setResults] = useState<BandResult[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getResults(game).then(setResults, (e) => setError(errorText(e, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t only changes the wording of an error
  }, [game, refreshKey]);

  return { results, error };
}

type Props = { results: BandResult[]; error: string; onMakeList: () => void };

export default function Results({ results, error, onMakeList }: Props) {
  const { t } = useI18n();
  const game = useGame();
  const [band, setBand] = useState<Band>("beginner");

  const listsIn = (b: Band) => results.find((r) => r.band === b)?.lists ?? 0;
  // Only characters on this game's roster: an id the database has never heard of can't become a tile.
  const roster = new Set(game.characters.map((c) => c.id));
  // Highest average first, so order within a tier means something.
  const rows = results.filter((r) => r.band === band && roster.has(r.item_id)).sort((a, b) => b.avg_score - a.avg_score);
  const lists = listsIn(band);
  const placements = Object.fromEntries(rows.map((r) => [r.item_id, Math.round(r.avg_score)]));
  const avg = Object.fromEntries(rows.map((r) => [r.item_id, r.avg_score.toFixed(1)]));
  const bandName = t(`band.${band}` as MessageKey);
  const listCount = (n: number) => t(n === 1 ? "results.list" : "results.lists", { n });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label={t("tab.results")}>
        {bandsFor(game).map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={band === b.id}
            onClick={() => setBand(b.id)}
            className={`space-y-1.5 rounded-lg border p-3 text-left transition-colors
              ${band === b.id ? "border-emerald-500/60 bg-ink-700" : "border-line bg-ink-800 hover:border-line-strong"}`}
          >
            <RankChip band={b.id}>{t(`band.${b.id}` as MessageKey)}</RankChip>
            <span className="block text-xs leading-4 text-ink-300">{bandRanks(game, b.id, t)}</span>
            <span className="block font-mono text-xs tabular-nums text-ink-300">{listCount(listsIn(b.id))}</span>
          </button>
        ))}
      </div>
      {error && <p className={ERROR}>{error}</p>}
      {lists < MIN_LISTS ? (
        <div className={`${PANEL} space-y-4 p-6 text-center`}>
          <p className="font-medium">{t("results.notEnough", { band: bandName })}</p>
          <div className="mx-auto h-1.5 max-w-xs overflow-hidden rounded-full bg-ink-700">
            <div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${(lists / MIN_LISTS) * 100}%` }} />
          </div>
          <p className="mx-auto max-w-md text-sm leading-5 text-ink-300">
            {t("results.progress", { n: lists, min: MIN_LISTS })}
          </p>
          <button type="button" onClick={onMakeList} className={`${BTN_PRIMARY} ${BTN_MD}`}>
            {t("results.addYours")}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm leading-5 text-ink-300">
            {t("results.summary", { n: lists, band: bandName })}
          </p>
          <TierRows placements={placements} detail={(id) => avg[id]} />
        </>
      )}
    </div>
  );
}
