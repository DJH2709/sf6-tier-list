"use client";
import { useState } from "react";
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, pointerWithin, useSensor, useSensors,
  type CollisionDetection, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import type { Placements } from "@/lib/store";
import TierRows, { scoreFromDropId } from "../TierRows";
import CharacterTile from "../CharacterTile";
import { idFromTileDropId } from "../DraggableTile";
import Roster from "./Roster";
import { useGame } from "../GameContext";
import { useI18n } from "@/lib/i18n/client";

// The pointer is over a tile and its row at once. The tile wins, so the character is dropped in
// front of that tile; over a row's empty space it goes to the end of the row.
const tilesFirst: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  const tiles = hits.filter((h) => idFromTileDropId(h.id) !== null);
  return tiles.length ? tiles : hits;
};

// Shows a translated sentence with the {name} part in bold, wherever the language puts it.
function Highlighted({ text, name }: { text: string; name: string }) {
  const [before, after = ""] = text.split("{name}");
  return <>{before}<b className="font-medium text-ink-100">{name}</b>{after}</>;
}

type Props = {
  placements: Placements;
  selected: string | null;
  onSelect: (id: string) => void;
  // beforeId: put the character just before this one in the row (from a drop on its tile).
  onPlace: (id: string, score: number, beforeId?: string) => void;
  onUnplace: (id: string) => void;
  onStartOver: () => void;
};

// Step 2: tap a row to place the selected character, or drag characters between rows and the roster.
export default function PlaceCharacters({ placements, selected, onSelect, onPlace, onUnplace, onStartOver }: Props) {
  const { t, nameOf } = useI18n();
  const game = useGame();
  const characters = game.characters;
  const [dragging, setDragging] = useState<string | null>(null);
  const unplaced = characters.filter((c) => !(c.id in placements));
  const placedCount = characters.length - unplaced.length;

  // A mouse drag starts after a few pixels so plain clicks still select. On touch, a short hold
  // starts a drag and a quick swipe still scrolls the page.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setDragging(id);
    onSelect(id);
  }

  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const id = String(e.active.id);
    const beforeId = idFromTileDropId(e.over?.id);
    const score = beforeId ? placements[beforeId] : scoreFromDropId(e.over?.id);
    if (beforeId === id) return;
    if (score != null) onPlace(id, score, beforeId ?? undefined);
    else if (e.over?.id === "roster" && id in placements) onUnplace(id);
  }

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b border-line bg-ink-900/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <div className="flex items-center justify-between gap-4 text-sm text-ink-300">
          <span>
            {selected ? (
              <Highlighted text={t("make.placing")} name={nameOf(selected, game)} />
            ) : (
              t("make.allPlaced")
            )}
          </span>
          <span className="font-mono text-xs tabular-nums text-ink-300">{placedCount}/{characters.length}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
          <div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${(placedCount / characters.length) * 100}%` }} />
        </div>
      </div>
      <DndContext
        id="tier-dnd"
        sensors={sensors}
        collisionDetection={tilesFirst}
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
          <TierRows
            placements={placements}
            selected={selected}
            onRowClick={(score) => { if (selected) onPlace(selected, score); }}
            onCharacterClick={onSelect}
            droppable
          />
          {placedCount > 1 && <p className="text-xs text-ink-400">{t("make.orderHint")}</p>}
          <Roster ids={unplaced.map((c) => c.id)} selected={selected} onSelect={onSelect} />
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
          onClick={onStartOver}
          className="flex min-h-6 items-center text-sm text-ink-300 underline-offset-2 hover:text-ink-100 hover:underline"
        >
          {t("make.startOver")}
        </button>
      )}
    </>
  );
}
