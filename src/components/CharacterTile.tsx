import type { Game } from "@/lib/games";
import portraits from "@/lib/portraits.json";
import { useI18n } from "@/lib/i18n/client";
import { useGame } from "./GameContext";

// The initials badge uses the English name so it looks the same in every language.
function englishName(game: Game, id: string) {
  return game.characters.find((c) => c.id === id)?.name ?? id;
}

// Characters without a portrait in public/characters/<game> get a stable colour and initials.
function badge(name: string) {
  const words = name.split(/[\s.\-]+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return { initials, colour: `hsl(${hash} 55% 38%)` };
}

const PORTRAITS = portraits as Record<string, string>;

export function Portrait({ id, size = "h-7 w-7" }: { id: string; size?: string }) {
  const game = useGame();
  const name = englishName(game, id);
  const src = PORTRAITS[`${game.id}/${id}`];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- static files, no optimisation needed
    return <img src={src} alt="" className={`${size} shrink-0 rounded object-cover`} />;
  }
  const { initials, colour } = badge(name);
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded text-[11px] font-bold text-white`}
      style={{ backgroundColor: colour }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

type Props = {
  id: string;
  selected?: boolean;
  detail?: string;
  onClick?: () => void;
  // Set by DraggableTile so a draggable tile looks the same as a tappable one.
  buttonRef?: (el: HTMLButtonElement | null) => void;
  dragProps?: React.HTMLAttributes<HTMLButtonElement>;
  dragging?: boolean;
};

export default function CharacterTile({ id, selected, detail, onClick, buttonRef, dragProps, dragging }: Props) {
  const { nameOf } = useI18n();
  const game = useGame();
  return (
    <button
      ref={buttonRef}
      type="button"
      {...dragProps}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
      disabled={!onClick && !dragProps}
      className={`flex items-center gap-2 rounded-md border bg-neutral-900 py-1 pl-1 pr-2.5 text-sm transition
        ${selected ? "border-emerald-500 ring-2 ring-emerald-500/60" : "border-neutral-700"}
        ${onClick ? "hover:border-neutral-500 active:scale-95" : "cursor-default"}
        ${dragProps ? "touch-manipulation cursor-grab active:cursor-grabbing" : ""}
        ${dragging ? "opacity-30" : ""}`}
    >
      <Portrait id={id} />
      <span className="whitespace-nowrap font-medium">{nameOf(id, game)}</span>
      {detail && <span className="text-xs tabular-nums text-neutral-400">{detail}</span>}
    </button>
  );
}
