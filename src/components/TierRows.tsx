"use client";
import { useDroppable } from "@dnd-kit/core";
import { TIERS } from "@/lib/sf6";
import CharacterTile from "./CharacterTile";
import DraggableTile from "./DraggableTile";

const TIER_COLOURS: Record<string, string> = {
  S: "bg-rose-500", A: "bg-orange-400", B: "bg-amber-300", C: "bg-lime-400", D: "bg-sky-400",
};

// Droppable id for a tier row; MakeList reads the score back out of it.
export const tierDropId = (score: number) => `tier-${score}`;
export const scoreFromDropId = (id: unknown) =>
  typeof id === "string" && id.startsWith("tier-") ? Number(id.slice(5)) : null;

type Props = {
  placements: Record<string, number>;
  onRowClick?: (score: number) => void;
  onCharacterClick?: (id: string) => void;
  selected?: string | null;
  detail?: (id: string) => string | undefined;
  // When set, rows accept dropped tiles and tiles can be dragged. Needs a DndContext above.
  droppable?: boolean;
};

type RowProps = Props & {
  tier: (typeof TIERS)[number];
  ids: string[];
  over?: boolean;
  rowRef?: (el: HTMLDivElement | null) => void;
};

function Row({ tier, ids, over, rowRef, onRowClick, onCharacterClick, selected, detail, droppable }: RowProps) {
  const Tile = droppable ? DraggableTile : CharacterTile;
  return (
    <div
      ref={rowRef}
      data-tier-row
      className={`flex min-h-14 border-b border-neutral-800 transition-colors last:border-b-0
        ${onRowClick ? "cursor-pointer hover:bg-neutral-800/60" : ""}
        ${over ? "bg-emerald-500/15" : ""}`}
      onClick={() => onRowClick?.(tier.score)}
    >
      <div
        className={`${TIER_COLOURS[tier.label]} flex w-12 shrink-0 items-center justify-center text-xl font-black text-neutral-950 sm:w-16 sm:text-2xl`}
      >
        {tier.label}
      </div>
      <div className="flex flex-1 flex-wrap content-start gap-1.5 p-2">
        {ids.map((id) => (
          <Tile
            key={id}
            id={id}
            selected={selected === id}
            detail={detail?.(id)}
            onClick={onCharacterClick && (() => onCharacterClick(id))}
          />
        ))}
        {onRowClick && ids.length === 0 && (
          <span className="self-center text-xs text-neutral-600">{droppable ? "Tap or drop here" : "Tap to place here"}</span>
        )}
      </div>
    </div>
  );
}

function DroppableRow(props: RowProps) {
  const { setNodeRef, isOver } = useDroppable({ id: tierDropId(props.tier.score) });
  return <Row {...props} rowRef={setNodeRef} over={isOver} />;
}

export default function TierRows(props: Props) {
  const { placements, droppable } = props;
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60">
      {TIERS.map((tier) => {
        const ids = Object.entries(placements)
          .filter(([, score]) => score === tier.score)
          .map(([id]) => id);
        return droppable ? (
          <DroppableRow key={tier.label} {...props} tier={tier} ids={ids} />
        ) : (
          <Row key={tier.label} {...props} tier={tier} ids={ids} />
        );
      })}
    </div>
  );
}
