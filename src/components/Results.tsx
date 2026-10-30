"use client";
import { useEffect, useState } from "react";
import { bandsFor, MIN_LISTS, type Band } from "@/lib/games";
import { getResults, type BandResult } from "@/lib/store";
import TierRows from "./TierRows";
import { useGame } from "./GameContext";

export default function Results({ refreshKey, onMakeList }: { refreshKey: number; onMakeList: () => void }) {
  const game = useGame();
  const BANDS = bandsFor(game);
  const [band, setBand] = useState<Band>("beginner");
  const [results, setResults] = useState<BandResult[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getResults(game).then(setResults, (e) => setError(String(e.message ?? e)));
  }, [game, refreshKey]);

  const listsIn = (b: Band) => results.find((r) => r.band === b)?.lists ?? 0;
  // Highest average first, so order within a tier means something.
  const rows = results.filter((r) => r.band === band).sort((a, b) => b.avg_score - a.avg_score);
  const lists = listsIn(band);
  const placements = Object.fromEntries(rows.map((r) => [r.item_id, Math.round(r.avg_score)]));
  const avg = Object.fromEntries(rows.map((r) => [r.item_id, r.avg_score.toFixed(1)]));
  const current = BANDS.find((b) => b.id === band)!;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BANDS.map((b) => (
          <button
            key={b.id}
            onClick={() => setBand(b.id)}
            className={`rounded-lg border px-3 py-2 text-left transition
              ${band === b.id ? "border-emerald-500 bg-emerald-500/10" : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"}`}
          >
            <span className="block text-sm font-semibold">{b.label}</span>
            <span className="block text-xs text-neutral-400">{b.ranks}</span>
            <span className="mt-1 block text-xs tabular-nums text-neutral-500">
              {listsIn(b.id)} {listsIn(b.id) === 1 ? "list" : "lists"}
            </span>
          </button>
        ))}
      </div>
      {error && <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{error}</p>}
      {lists < MIN_LISTS ? (
        <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-center">
          <p className="font-semibold">Not enough votes from {current.label} players yet</p>
          <div className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full bg-emerald-500" style={{ width: `${(lists / MIN_LISTS) * 100}%` }} />
          </div>
          <p className="text-sm text-neutral-400">
            {lists} of {MIN_LISTS} lists. Results show once {MIN_LISTS} {MIN_LISTS === 1 ? "player" : "players"} at this rank have voted, so one
            person can&apos;t decide the list.
          </p>
          <button onClick={onMakeList} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400">
            Add your tier list
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-400">
            Average of {lists} {lists === 1 ? "list" : "lists"} from {current.label} players. The number is each character&apos;s average score
            (S = 5, D = 1). Ranks are self-reported unless proven.
          </p>
          <TierRows placements={placements} detail={(id) => avg[id]} />
        </>
      )}
    </div>
  );
}
