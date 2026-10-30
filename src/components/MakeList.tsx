"use client";
import { useState } from "react";
import { CHARACTERS, RANKS } from "@/lib/sf6";
import { submitList, type Placements } from "@/lib/store";
import TierRows from "./TierRows";
import CharacterTile, { nameOf } from "./CharacterTile";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-neutral-950">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function MakeList({ onSubmitted }: { onSubmitted: () => void }) {
  const [placements, setPlacements] = useState<Placements>({});
  const [selected, setSelected] = useState<string | null>(CHARACTERS[0].id);
  const [rank, setRank] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const unplaced = CHARACTERS.filter((c) => !(c.id in placements));
  const placedCount = CHARACTERS.length - unplaced.length;
  const needsProof = RANKS.find((r) => r.id === rank)?.needsProof;

  function place(score: number) {
    if (!selected) return;
    setPlacements({ ...placements, [selected]: score });
    setSelected(unplaced.find((c) => c.id !== selected)?.id ?? null);
  }

  async function submit() {
    setSaving(true);
    setStatus(null);
    try {
      await submitList(rank, placements, needsProof ? proofUrl : undefined);
      setStatus({ text: "Saved. Thanks for voting." });
      onSubmitted();
    } catch (e) {
      setStatus({ text: e instanceof Error ? e.message : "Something went wrong.", error: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <Step n={1} title="Your current rank">
        <select
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2.5 sm:w-72"
        >
          <option value="">Choose your rank</option>
          {RANKS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        {needsProof && (
          <label className="block space-y-1 text-sm">
            <span>Link to your Buckler&apos;s Boot Camp profile</span>
            <input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://www.streetfighter.com/6/buckler/profile/..."
              className="block w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2.5"
            />
            <span className="block text-neutral-400">
              Top ranks are checked by hand. Until then, your list counts in the Advanced band.
            </span>
          </label>
        )}
      </Step>

      <Step n={2} title="Rank the roster">
        <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
          <div className="flex items-center justify-between text-sm">
            <span>
              {selected ? (
                <>Placing <b className="text-amber-300">{nameOf(selected)}</b>. Tap a tier.</>
              ) : (
                "All placed. Tap any character to move them."
              )}
            </span>
            <span className="tabular-nums text-neutral-400">{placedCount}/{CHARACTERS.length}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${(placedCount / CHARACTERS.length) * 100}%` }} />
          </div>
        </div>
        <TierRows placements={placements} selected={selected} onRowClick={place} onCharacterClick={setSelected} />
        {unplaced.length > 0 && (
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-dashed border-neutral-700 p-3">
            {unplaced.map((c) => (
              <CharacterTile key={c.id} id={c.id} selected={selected === c.id} onClick={() => setSelected(c.id)} />
            ))}
          </div>
        )}
        {placedCount > 0 && (
          <button
            type="button"
            onClick={() => { setPlacements({}); setSelected(CHARACTERS[0].id); }}
            className="text-sm text-neutral-400 underline-offset-2 hover:underline"
          >
            Start over
          </button>
        )}
      </Step>

      <Step n={3} title="Submit">
        <button
          disabled={!rank || unplaced.length > 0 || saving}
          onClick={submit}
          className="w-full rounded-lg bg-amber-400 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {saving ? "Saving..." : !rank ? "Choose your rank first" : unplaced.length > 0 ? `Place ${unplaced.length} more` : "Submit my tier list"}
        </button>
        {status && <p className={`text-sm ${status.error ? "text-red-400" : "text-lime-400"}`}>{status.text}</p>}
      </Step>
    </div>
  );
}
