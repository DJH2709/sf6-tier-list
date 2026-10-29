"use client";
import { useState } from "react";
import { CHARACTERS, RANKS } from "@/lib/sf6";
import { submitList, type Placements } from "@/lib/store";
import TierRows, { nameOf } from "./TierRows";

export default function MakeList({ onSubmitted }: { onSubmitted: () => void }) {
  const [placements, setPlacements] = useState<Placements>({});
  const [selected, setSelected] = useState<string | null>(CHARACTERS[0].id);
  const [rank, setRank] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [status, setStatus] = useState("");

  const unplaced = CHARACTERS.filter((c) => !(c.id in placements));
  const needsProof = RANKS.find((r) => r.id === rank)?.needsProof;

  function place(score: number) {
    if (!selected) return;
    setPlacements({ ...placements, [selected]: score });
    setSelected(unplaced.find((c) => c.id !== selected)?.id ?? null);
  }

  async function submit() {
    setStatus("Saving...");
    try {
      await submitList(rank, placements, needsProof ? proofUrl : undefined);
      setStatus("Saved. Thanks for voting.");
      onSubmitted();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-neutral-400">Tap a character, then tap a tier to place them.</p>
      <TierRows placements={placements} selected={selected} onRowClick={place} onCharacterClick={setSelected} />
      <div className="flex flex-wrap gap-2">
        {unplaced.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`rounded px-3 py-1 text-sm bg-neutral-800 border border-neutral-600 ${selected === c.id ? "ring-2 ring-white" : ""}`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {selected && <p className="text-sm">Placing: <b>{nameOf(selected)}</b></p>}

      <div className="space-y-2 rounded-lg border border-neutral-700 p-4">
        <label className="block text-sm">
          Your current rank
          <select value={rank} onChange={(e) => setRank(e.target.value)} className="mt-1 block w-full rounded bg-neutral-800 p-2">
            <option value="">Choose your rank</option>
            {RANKS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
        {needsProof && (
          <label className="block text-sm">
            Proof: link to your Buckler&apos;s Boot Camp profile
            <input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://www.streetfighter.com/6/buckler/profile/..."
              className="mt-1 block w-full rounded bg-neutral-800 p-2"
            />
            <span className="text-neutral-400">
              Until your rank is checked, your list counts in the Advanced band.
            </span>
          </label>
        )}
        <button
          disabled={!rank || unplaced.length > 0}
          onClick={submit}
          className="rounded bg-white px-4 py-2 font-semibold text-neutral-900 disabled:opacity-40"
        >
          {unplaced.length > 0 ? `Place ${unplaced.length} more` : "Submit my tier list"}
        </button>
        {status && <p className="text-sm">{status}</p>}
      </div>
    </div>
  );
}
