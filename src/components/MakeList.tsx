"use client";
import { useEffect, useRef, useState } from "react";
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, pointerWithin, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { CHARACTERS, CURRENT_PATCH, RANKS } from "@/lib/sf6";
import { getMyLists, submitList, type MyList, type Placements } from "@/lib/store";
import type { Profile } from "@/lib/account";
import TierRows, { scoreFromDropId } from "./TierRows";
import CharacterTile from "./CharacterTile";
import DraggableTile from "./DraggableTile";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "@/lib/i18n/config";
import type { MessageKey } from "@/locales/en";

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

// Shows a translated sentence with the {name} part in bold, wherever the language puts it.
function Highlighted({ text, name }: { text: string; name: string }) {
  const [before, after = ""] = text.split("{name}");
  return <>{before}<b className="text-emerald-300">{name}</b>{after}</>;
}

// Unplaced characters. Dropping a placed character here takes them back out of the list.
function Roster({ ids, selected, onSelect }: { ids: string[]; selected: string | null; onSelect: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: "roster" });
  const { t } = useI18n();
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
        <span className="text-xs text-neutral-500">{t("make.rosterEmpty")}</span>
      )}
    </div>
  );
}

type Props = {
  profile: Profile | null;
  onSubmitted: (result: { isPublic: boolean; updated: boolean }) => void;
};

export default function MakeList({ profile, onSubmitted }: Props) {
  const { t, nameOf } = useI18n();
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
    getMyLists().then((lists) => {
      if (touched.current) return;
      const current = lists.find((l) => l.patch === CURRENT_PATCH);
      const previous = lists.find((l) => l.patch !== CURRENT_PATCH);
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
    }, (e) => setStatus({ text: errorText(e, t), error: true }));
    // Runs once on mount; t only changes the wording of an error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unplaced = CHARACTERS.filter((c) => !(c.id in placements));
  const placedCount = CHARACTERS.length - unplaced.length;
  const needsProof = RANKS.find((r) => r.id === rank)?.needsProof;

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
      const { updated } = await submitList(rank, placements, needsProof ? proofUrl : undefined, isPublic);
      setStatus({ text: t(updated ? "make.updated" : "make.thanks") });
      setExisting((e) => e ?? { id: "", patch: CURRENT_PATCH, rank, proofUrl: proofUrl || null, verification: "none", isPublic, placements });
      setBasedOn(null);
      onSubmitted({ isPublic, updated });
    } catch (e) {
      setStatus({ text: errorText(e, t), error: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {existing && (
        <p className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300">
          {t("make.editing", { patch: CURRENT_PATCH })}
        </p>
      )}
      {basedOn && (
        <p className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300">
          {t("make.newPatch", { patch: basedOn })}
        </p>
      )}

      <Step n={1} title={t("make.step1")}>
        <select
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2.5 sm:w-72"
        >
          <option value="">{t("make.chooseRank")}</option>
          {RANKS.map((r) => <option key={r.id} value={r.id}>{t(`rank.${r.id}` as MessageKey)}</option>)}
        </select>
        {needsProof && (
          <label className="block space-y-1 text-sm">
            <span>{t("make.proofLabel")}</span>
            <input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://www.streetfighter.com/6/buckler/profile/..."
              className="block w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2.5"
            />
            <span className="block text-neutral-400">
              {t("make.proofNote")}
              {existing?.verification === "approved" && ` ${t("make.proofRecheck")}`}
            </span>
          </label>
        )}
      </Step>

      <Step n={2} title={t("make.step2")}>
        <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
          <div className="flex items-center justify-between text-sm">
            <span>
              {selected ? (
                <Highlighted text={t("make.placing")} name={nameOf(selected)} />
              ) : (
                t("make.allPlaced")
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
              draggable: t("make.dragHelp"),
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
            {t("make.startOver")}
          </button>
        )}
      </Step>

      <Step n={3} title={t("make.step3")}>
        {profile && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
            {t("make.showOnProfile", { username: profile.username })}
          </label>
        )}
        <button
          disabled={!rank || unplaced.length > 0 || saving}
          onClick={submit}
          className="w-full rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:pointer-events-none disabled:opacity-40 sm:w-auto"
        >
          {saving ? t("make.saving") : !rank ? t("make.chooseRankFirst") : unplaced.length > 0 ? t("make.placeMore", { n: unplaced.length }) : t(existing ? "make.update" : "make.submit")}
        </button>
        {status && <p className={`text-sm ${status.error ? "text-red-400" : "text-lime-400"}`}>{status.text}</p>}
      </Step>
    </div>
  );
}
