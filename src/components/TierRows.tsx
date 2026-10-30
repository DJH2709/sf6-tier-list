import { TIERS } from "@/lib/sf6";
import CharacterTile from "./CharacterTile";

const TIER_COLOURS: Record<string, string> = {
  S: "bg-rose-500", A: "bg-orange-400", B: "bg-amber-300", C: "bg-lime-400", D: "bg-sky-400",
};

type Props = {
  placements: Record<string, number>;
  onRowClick?: (score: number) => void;
  onCharacterClick?: (id: string) => void;
  selected?: string | null;
  detail?: (id: string) => string | undefined;
};

export default function TierRows({ placements, onRowClick, onCharacterClick, selected, detail }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60">
      {TIERS.map((tier) => {
        const ids = Object.entries(placements)
          .filter(([, score]) => score === tier.score)
          .map(([id]) => id);
        return (
          <div
            key={tier.label}
            data-tier-row
            className={`flex min-h-14 border-b border-neutral-800 last:border-b-0
              ${onRowClick ? "cursor-pointer hover:bg-neutral-800/60" : ""}`}
            onClick={() => onRowClick?.(tier.score)}
          >
            <div
              className={`${TIER_COLOURS[tier.label]} flex w-12 shrink-0 items-center justify-center text-xl font-black text-neutral-950 sm:w-16 sm:text-2xl`}
            >
              {tier.label}
            </div>
            <div className="flex flex-1 flex-wrap content-start gap-1.5 p-2">
              {ids.map((id) => (
                <CharacterTile
                  key={id}
                  id={id}
                  selected={selected === id}
                  detail={detail?.(id)}
                  onClick={onCharacterClick && (() => onCharacterClick(id))}
                />
              ))}
              {onRowClick && ids.length === 0 && (
                <span className="self-center text-xs text-neutral-600">Tap to place here</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
