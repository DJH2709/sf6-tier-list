import { CHARACTERS, TIERS } from "@/lib/sf6";

const TIER_COLOURS: Record<string, string> = {
  S: "bg-red-500", A: "bg-orange-400", B: "bg-yellow-400", C: "bg-green-500", D: "bg-sky-500",
};

type Props = {
  placements: Record<string, number>;
  onRowClick?: (score: number) => void;
  onCharacterClick?: (id: string) => void;
  selected?: string | null;
  detail?: (id: string) => string | undefined;
};

export function nameOf(id: string) {
  return CHARACTERS.find((c) => c.id === id)?.name ?? id;
}

export default function TierRows({ placements, onRowClick, onCharacterClick, selected, detail }: Props) {
  return (
    <div className="divide-y divide-neutral-700 rounded-lg border border-neutral-700 overflow-hidden">
      {TIERS.map((tier) => (
        <div
          key={tier.label}
          className={`flex min-h-16 ${onRowClick ? "cursor-pointer hover:bg-neutral-800" : ""}`}
          onClick={() => onRowClick?.(tier.score)}
        >
          <div className={`${TIER_COLOURS[tier.label]} w-14 shrink-0 flex items-center justify-center text-2xl font-bold text-neutral-900`}>
            {tier.label}
          </div>
          <div className="flex flex-wrap gap-2 p-2">
            {Object.entries(placements)
              .filter(([, score]) => score === tier.score)
              .map(([id]) => (
                <button
                  key={id}
                  onClick={(e) => {
                    if (!onCharacterClick) return;
                    e.stopPropagation();
                    onCharacterClick(id);
                  }}
                  className={`rounded px-3 py-1 text-sm bg-neutral-700 ${selected === id ? "ring-2 ring-white" : ""}`}
                >
                  {nameOf(id)}
                  {detail?.(id) && <span className="ml-1 text-neutral-400">{detail(id)}</span>}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
