"use client";
import { useDroppable } from "@dnd-kit/core";
import { TIERS } from "@/lib/games";
import CharacterTile from "./CharacterTile";
import DraggableTile from "./DraggableTile";
import { useI18n } from "@/lib/i18n/client";

// The five tier colours are the product's own vocabulary and the one place colour lives.
export const TIER_COLOURS: Record<string, string> = {
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
  const { t } = useI18n();
  return (
    <div
      ref={rowRef}
      data-tier-row
      className={`flex min-h-14 border-b border-line transition-colors last:border-b-0
        ${onRowClick ? "cursor-pointer hover:bg-ink-700/60" : ""}
        ${over ? "bg-emerald-500/10" : ""}`}
      onClick={() => onRowClick?.(tier.score)}
    >
      <div
        className={`${TIER_COLOURS[tier.label]} flex w-12 shrink-0 items-center justify-center text-lg font-semibold text-ink-950 sm:w-16 sm:text-xl`}
      >
        {tier.label}
      </div>
      <div className="flex flex-1 flex-wrap content-start gap-1.5 p-2">
        {ids.map((id) =>
          droppable ? (
            <DraggableTile
              key={id}
              id={id}
              selected={selected === id}
              onClick={onCharacterClick && (() => onCharacterClick(id))}
              dropTarget
            />
          ) : (
            <CharacterTile
              key={id}
              id={id}
              selected={selected === id}
              detail={detail?.(id)}
              onClick={onCharacterClick && (() => onCharacterClick(id))}
            />
          ),
        )}
        {onRowClick && ids.length === 0 && (
          <span className="self-center text-xs text-ink-400">{t(droppable ? "tiers.tapOrDrop" : "tiers.tapToPlace")}</span>
        )}
      </div>
    </div>
  );
}

function DroppableRow(props: RowProps) {
  const { setNodeRef, isOver } = useDroppable({ id: tierDropId(props.tier.score) });
  return <Row {...props} rowRef={setNodeRef} over={isOver} />;
}

// Each row lists its characters in the order of the placements' keys (the player's order).
export default function TierRows(props: Props) {
  const { placements, droppable } = props;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink-800">
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
