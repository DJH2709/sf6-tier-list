"use client";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import CharacterTile from "./CharacterTile";

type Props = { id: string; selected?: boolean; onClick?: () => void; dropTarget?: boolean };

// Droppable id for a tile inside a tier row: a character dropped on it goes just before it.
export const tileDropId = (id: string) => `tile-${id}`;
export const idFromTileDropId = (id: unknown) =>
  typeof id === "string" && id.startsWith("tile-") ? id.slice(5) : null;

// A tile that can be dragged into a tier row as well as tapped. Only used inside MakeList's
// DndContext. With dropTarget (tiles already in a row), other tiles can be dropped on it to
// put them in front of it, which is how a player orders characters inside a tier.
export default function DraggableTile({ id, selected, onClick, dropTarget }: Props) {
  const { attributes, listeners, setNodeRef: dragRef, isDragging } = useDraggable({ id });
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: tileDropId(id), disabled: !dropTarget });
  return (
    <span className="relative flex">
      {/* Where the dropped character will land: a bar on this tile's left edge. */}
      {isOver && !isDragging && (
        <span aria-hidden className="absolute -left-1 top-0 bottom-0 w-0.5 rounded-full bg-emerald-400" />
      )}
      <CharacterTile
        id={id}
        selected={selected}
        onClick={onClick}
        buttonRef={(el) => { dragRef(el); dropRef(el); }}
        dragProps={{ ...attributes, ...listeners }}
        dragging={isDragging}
      />
    </span>
  );
}
