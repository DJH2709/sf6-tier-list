"use client";
import { useEffect, useRef, useState } from "react";
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, pointerWithin, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { getMyLists, submitList, type MyList, type Placements } from "@/lib/store";
import type { Profile } from "@/lib/account";
import TierRows, { scoreFromDropId } from "./TierRows";
import CharacterTile, { nameOf } from "./CharacterTile";
import DraggableTile from "./DraggableTile";
import { useGame } from "./GameContext";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-neutral-950">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

// Unplaced characters. Dropping a placed character here takes them back out of the list.
function Roster({ ids, selected, onSelect }: { ids: string[]; selected: string | null; onSelect: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: "roster" });
  return (
    <div
      ref={setNodeRef}
      data-roster
      className={`flex flex-wrap gap-1.5 rounded-xl border border-dashed p-3 transition-colors
        ${isOver ? "border-emerald-500 bg-emerald-500/10" : "border-neutral-700"}`}
    >
      {ids.map((id) => (
        <DraggableTile key={id} id={id} selected={selected === id} onClick={() => onSelect(id)} />
      ))}
      {ids.length === 0 && (
        <span className="text-xs text-neutral-500">All placed. Drop a character here to take them out.</span>
      )}
    </div>
  );
}

type Props = {
  profile: Profile | null;
  onSubmitted: (result: { isPublic: boolean; updated: boolean }) => void;
};

export default function MakeList({ profile, onSubmitted }: Props) {
  const game = useGame();
  const CHARACTERS = game.characters;
  const [placements, setPlacements] = useState<Placements>({});
  const [selected, setSelected] = useState<string | null>(CHARACTERS[0].id);
  const [dragging, setDragging] = useState<string | null>(null);
  const [rank, setRank] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  // The list already saved for this patch (editing), or the patch an older list was copied from.
  const [existing, setExisting] = useState<MyList | null>(null);
  const [basedOn, setBasedOn] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  // Don't overwrite placements the player made while their saved list was still loading.
  const touched = useRef(false);

  // A mouse drag starts after a few pixels so plain clicks still select. On touch, a short hold
  // starts a drag and a quick swipe still scrolls the page.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  useEffect(() => {
    getMyLists(game).then((lists) => {
      if (touched.current) return;
      const current = lists.find((l) => l.patch === game.patch);
      const previous = lists.find((l) => l.patch !== game.patch);
      const from = current ?? previous;
      if (!from) return;
      // Characters that joined since the old list stay unplaced.
      const known = new Set(CHARACTERS.map((c) => c.id));
      const kept = Object.fromEntries(Object.entries(from.placements).filter(([id]) => known.has(id)));
      setPlacements(kept);
      setSelected(CHARACTERS.find((c) => !(c.id in kept))?.id ?? null);
      setRank(from.rank);
      setProofUrl(from.proofUrl ?? "");
      setIsPublic(from.isPublic);
      if (current) setExisting(current);
      else setBasedOn(from.patch);
    }, (e) => setStatus({ text: e instanceof Error ? e.message : String(e), error: true }));
  }, [game, CHARACTERS]);

  const unplaced = CHARACTERS.filter((c) => !(c.id in placements));
  const placedCount = CHARACTERS.length - unplaced.length;
  const needsProof = game.ranks.find((r) => r.id === rank)?.needsProof;

  function placeId(id: string, score: number) {
    touched.current = true;
    const next = { ...placements, [id]: score };
    setPlacements(next);
    setSelected(CHARACTERS.find((c) => !(c.id in next))?.id ?? null);
  }

  function place(score: number) {
    if (selected) placeId(selected, score);
  }

  function unplace(id: string) {
    touched.current = true;
    const next = { ...placements };
    delete next[id];
    setPlacements(next);
    setSelected(id);
  }

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setDragging(id);
    setSelected(id);
  }

  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const id = String(e.active.id);
    const score = scoreFromDropId(e.over?.id);
    if (score !== null) placeId(id, score);
    else if (e.over?.id === "roster" && id in placements) unplace(id);
  }

  async function submit() {
    setSaving(true);
    setStatus(null);
    try {
      const { updated } = await submitList(game, rank, placements, needsProof ? proofUrl : undefined, isPublic);
      setStatus({ text: updated ? "Updated." : "Saved. Thanks for voting." });
      setExisting((e) => e ?? { id: "", patch: game.patch, rank, proofUrl: proofUrl || null, verification: "none", isPublic, placements });
      setBasedOn(null);
      onSubmitted({ isPublic, updated });
    } catch (e) {
      setStatus({ text: e instanceof Error ? e.message : "Something went wrong.", error: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {existing && (
        <p className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300">
          You&apos;re editing the list you submitted for {game.short} patch {game.patch}. Saving replaces it.
        </p>
      )}
      {basedOn && (
        <p className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300">
          New patch. This starts from your patch {basedOn} list, so move what&apos;s changed and submit.
        </p>
      )}

      <Step n={1} title="Your current rank">
        <select
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2.5 sm:w-72"
        >
          <option value="">Choose your rank</option>
          {game.ranks.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        {needsProof && (
          <label className="block space-y-1 text-sm">
            <span>Link to your {game.proofSite}</span>
            <input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder={game.proofPlaceholder}
              className="block w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2.5"
            />
            <span className="block text-neutral-400">
              Top ranks are checked by hand. Until then, your list counts in the Advanced band.
              {existing?.verification === "approved" && " Changing your rank or link means it gets checked again."}
            </span>
          </label>
        )}
      </Step>

      <Step n={2} title="Rank the roster">
        <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
          <div className="flex items-center justify-between text-sm">
            <span>
              {selected ? (
                <>Placing <b className="text-emerald-300">{nameOf(game, selected)}</b>. Tap a tier, or drag.</>
              ) : (
                "All placed. Tap or drag any character to move them."
              )}
            </span>
            <span className="tabular-nums text-neutral-400">{placedCount}/{CHARACTERS.length}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(placedCount / CHARACTERS.length) * 100}%` }} />
          </div>
        </div>
        <DndContext
          id="tier-dnd"
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragging(null)}
          accessibility={{
            screenReaderInstructions: {
              draggable: "Press to select this character, then press a tier row to place them. With a mouse or touch you can also drag.",
            },
          }}
        >
          <div className="space-y-3">
            <TierRows placements={placements} selected={selected} onRowClick={place} onCharacterClick={setSelected} droppable />
            <Roster ids={unplaced.map((c) => c.id)} selected={selected} onSelect={setSelected} />
          </div>
          {/* pointer-events-none so the mouseup lands on the row underneath. A disabled button in the
              overlay would swallow it and the drag would never end. */}
          <DragOverlay dropAnimation={null} className="pointer-events-none">
            {dragging ? <CharacterTile id={dragging} selected /> : null}
          </DragOverlay>
        </DndContext>
        {placedCount > 0 && (
          <button
            type="button"
            onClick={() => { touched.current = true; setPlacements({}); setSelected(CHARACTERS[0].id); }}
            className="text-sm text-neutral-400 underline-offset-2 hover:underline"
          >
            Start over
          </button>
        )}
      </Step>

      <Step n={3} title="Submit">
        {profile && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
            Show on my profile (/u/{profile.username}). Untick to keep it private; it still counts in the results.
          </label>
        )}
        <button
          disabled={!rank || unplaced.length > 0 || saving}
          onClick={submit}
          className="w-full rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:pointer-events-none disabled:opacity-40 sm:w-auto"
        >
          {saving ? "Saving..." : !rank ? "Choose your rank first" : unplaced.length > 0 ? `Place ${unplaced.length} more` : existing ? "Update my tier list" : "Submit my tier list"}
        </button>
        {status && <p className={`text-sm ${status.error ? "text-red-400" : "text-lime-400"}`}>{status.text}</p>}
      </Step>
    </div>
  );
}
