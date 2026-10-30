import { CHARACTERS } from "@/lib/sf6";

export function nameOf(id: string) {
  return CHARACTERS.find((c) => c.id === id)?.name ?? id;
}

// No official art: each character gets a stable colour and initials from their name.
function badge(name: string) {
  const words = name.split(/[\s.\-]+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return { initials, colour: `hsl(${hash} 55% 38%)` };
}

type Props = {
  id: string;
  selected?: boolean;
  detail?: string;
  onClick?: () => void;
};

export default function CharacterTile({ id, selected, detail, onClick }: Props) {
  const name = nameOf(id);
  const { initials, colour } = badge(name);
  return (
    <button
      type="button"
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
      disabled={!onClick}
      className={`flex items-center gap-2 rounded-md border bg-neutral-900 py-1 pl-1 pr-2.5 text-sm transition
        ${selected ? "border-amber-400 ring-2 ring-amber-400/60" : "border-neutral-700"}
        ${onClick ? "hover:border-neutral-500 active:scale-95" : "cursor-default"}`}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white"
        style={{ backgroundColor: colour }}
        aria-hidden
      >
        {initials}
      </span>
      <span className="whitespace-nowrap font-medium">{name}</span>
      {detail && <span className="text-xs tabular-nums text-neutral-400">{detail}</span>}
    </button>
  );
}
