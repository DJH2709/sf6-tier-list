"use client";
import { useDraggable } from "@dnd-kit/core";
import CharacterTile from "./CharacterTile";

type Props = { id: string; selected?: boolean; onClick?: () => void };

// A tile that can be dragged into a tier row as well as tapped. Only used inside MakeList's DndContext.
export default function DraggableTile({ id, selected, onClick }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <CharacterTile
      id={id}
      selected={selected}
      onClick={onClick}
      buttonRef={setNodeRef}
      dragProps={{ ...attributes, ...listeners }}
      dragging={isDragging}
    />
  );
}
