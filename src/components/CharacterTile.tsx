import type { Game } from "@/lib/games";
import portraits from "@/lib/portraits.json";
import { useI18n } from "@/lib/i18n/client";
import { useGame } from "./GameContext";
import { usePicturesOnly } from "@/lib/tileView";

// The initials badge uses the English name so it looks the same in every language.
function englishName(game: Game, id: string) {
  return game.characters.find((c) => c.id === id)?.name ?? id;
}

// Characters without a portrait in public/characters/<game> get a quiet initials badge. The
// tier row already carries the colour, so the badge doesn't need its own.
function initialsOf(name: string) {
  const words = name.split(/[\s.\-()]+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

const PORTRAITS = portraits as Record<string, string>;

export const hasPortrait = (game: Game, id: string) => `${game.id}/${id}` in PORTRAITS;
// Whether any of this game's characters has a picture, so the "Pictures only" switch is worth showing.
export const gameHasPortraits = (game: Game) => game.characters.some((c) => hasPortrait(game, c.id));

// `px` is the rendered size in pixels, so the image has width and height before it loads.
export function Portrait({ id, size = "h-7 w-7", px = 28 }: { id: string; size?: string; px?: number }) {
  const game = useGame();
  const name = englishName(game, id);
  const src = PORTRAITS[`${game.id}/${id}`];
  if (src) {
    // object-contain, not cover: Clash Royale cards are taller than wide, and cropping them would
    // alter Supercell's art, which their fan content policy doesn't allow.
    // eslint-disable-next-line @next/next/no-img-element -- static files, no optimisation needed
    return <img src={src} alt="" width={px} height={px} loading="lazy" decoding="async" className={`${size} shrink-0 rounded object-contain`} />;
  }
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded bg-ink-600 text-[11px] font-medium leading-none text-ink-300`}
      title={name}
      aria-hidden
    >
      {initialsOf(name)}
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
  const name = nameOf(id, game);
  // Pictures only: a bigger picture with no name, so a full list fits in one screenshot. The name
  // stays as the tooltip and accessible label. Characters without a picture keep their name.
  const pictureOnly = usePicturesOnly() && hasPortrait(game, id);
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
      title={pictureOnly ? name : undefined}
      aria-label={pictureOnly ? (detail ? `${name} ${detail}` : name) : undefined}
      className={`relative flex items-center rounded-md border bg-ink-700 text-sm transition-colors
        ${pictureOnly ? "p-0.5" : "min-h-9 gap-2 py-1 pl-1 pr-2.5"}
        ${selected ? "border-emerald-500 ring-1 ring-emerald-500/50" : "border-line-strong"}
        ${onClick ? "hover:border-ink-400 active:scale-[0.98]" : "cursor-default"}
        ${dragProps ? "touch-manipulation cursor-grab active:cursor-grabbing" : ""}
        ${dragging ? "opacity-30" : ""}`}
    >
      {pictureOnly ? (
        <>
          <Portrait id={id} size="h-11 w-11" px={44} />
          {detail && (
            <span className="absolute -bottom-1 -right-1 rounded bg-ink-950/90 px-1 font-mono text-[10px] leading-4 tabular-nums text-ink-100">
              {detail}
            </span>
          )}
        </>
      ) : (
        <>
          <Portrait id={id} />
          <span className="whitespace-nowrap font-medium">{name}</span>
          {detail && <span className="font-mono text-xs tabular-nums text-ink-300">{detail}</span>}
        </>
      )}
    </button>
  );
}
