"use client";
import { useEffect, useState } from "react";
import { BANDS, MIN_LISTS, type Band } from "@/lib/sf6";
import { getResults, type BandResult } from "@/lib/store";
import TierRows from "./TierRows";

export default function Results({ refreshKey }: { refreshKey: number }) {
  const [band, setBand] = useState<Band>("beginner");
  const [results, setResults] = useState<BandResult[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getResults().then(setResults, (e) => setError(String(e.message ?? e)));
  }, [refreshKey]);

  const rows = results.filter((r) => r.band === band);
  const lists = rows[0]?.lists ?? 0;
  const placements = Object.fromEntries(rows.map((r) => [r.character_id, Math.round(r.avg_score)]));
  const avg = Object.fromEntries(rows.map((r) => [r.character_id, r.avg_score.toFixed(1)]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {BANDS.map((b) => (
          <button
            key={b.id}
            onClick={() => setBand(b.id)}
            className={`rounded px-3 py-1 text-sm ${band === b.id ? "bg-white text-neutral-900" : "bg-neutral-800"}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      {error && <p className="text-red-400">{error}</p>}
      <p className="text-sm text-neutral-400">
        {lists} {lists === 1 ? "list" : "lists"} in this band. Ranks are self-reported unless proven.
      </p>
      {lists < MIN_LISTS ? (
        <p className="rounded-lg border border-neutral-700 p-6 text-center">
          This band needs {MIN_LISTS - lists} more {MIN_LISTS - lists === 1 ? "list" : "lists"} before results show.
        </p>
      ) : (
        <TierRows placements={placements} detail={(id) => avg[id]} />
      )}
    </div>
  );
}
