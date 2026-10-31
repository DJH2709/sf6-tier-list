"use client";
import { useState } from "react";
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, pointerWithin, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import type { Placements } from "@/lib/store";
import TierRows, { scoreFromDropId } from "../TierRows";
import CharacterTile from "../CharacterTile";
import Roster from "./Roster";
import RosterFilter, { shown, type Filter } from "../RosterFilter";
import { useGame } from "../GameContext";
import { useI18n } from "@/lib/i18n/client";

// Shows a translated sentence with the {name} part in bold, wherever the language puts it.
function Highlighted({ text, name }: { text: string; name: string }) {
  const [before, after = ""] = text.split("{name}");
  return <>{before}<b className="font-medium text-ink-100">{name}</b>{after}</>;
}

type Props = {
  placements: Placements;
  selected: string | null;
  onSelect: (id: string) => void;
  onPlace: (id: string, score: number) => void;
  onUnplace: (id: string) => void;
  onStartOver: () => void;
  filter: Filter;
  onFilter: (f: Filter) => void;
};

// Step 2: tap a row to place the selected character, or drag characters between rows and the roster.
export default function PlaceCharacters({ placements, selected, onSelect, onPlace, onUnplace, onStartOver, filter, onFilter }: Props) {
  const { t, nameOf } = useI18n();
  const game = useGame();
  const characters = game.characters;
  const [dragging, setDragging] = useState<string | null>(null);
  const unplaced = characters.filter((c) => !(c.id in placements));
  const placedCount = characters.length - unplaced.length;
  // The role chips and search narrow both the roster and the rows, e.g. to rank just the tanks.
  const visible = (id: string) => shown(game, id, nameOf(id, game), filter);
  const visiblePlacements = Object.fromEntries(Object.entries(placements).filter(([id]) => visible(id)));

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
    const score = scoreFromDropId(e.over?.id);
    if (score !== null) onPlace(id, score);
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
          <RosterFilter game={game} filter={filter} onFilter={onFilter} />
          <TierRows
            placements={visiblePlacements}
            selected={selected}
            onRowClick={(score) => { if (selected) onPlace(selected, score); }}
            onCharacterClick={onSelect}
            droppable
          />
          <Roster ids={unplaced.filter((c) => visible(c.id)).map((c) => c.id)} selected={selected} onSelect={onSelect} />
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
