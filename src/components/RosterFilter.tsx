"use client";
import type { Game } from "@/lib/games";
import { SEARCH_FROM } from "@/lib/games";
import { useI18n } from "@/lib/i18n/client";
import { INPUT, SEGMENT, SEGMENT_ITEM, SEGMENT_OFF, SEGMENT_ON } from "./ui";
import { gameHasPortraits } from "./CharacterTile";
import { setPicturesOnly, usePicturesOnly } from "@/lib/tileView";

export type Filter = { role: string | null; query: string };
export const NO_FILTER: Filter = { role: null, query: "" };

// Lower case without accents, so "jager" finds "Jäger".
const fold = (s: string) => s.replace(/ø/gi, "o").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Whether a character shows under the current role chip and search text.
export function shown(game: Game, id: string, name: string, filter: Filter) {
  if (filter.role) {
    const group = game.roles?.find((r) => r.label === filter.role);
    if (group && !group.ids.includes(id)) return false;
  }
  const q = fold(filter.query.trim());
  return !q || fold(name).includes(q) || id.includes(q);
}

// Switches tiles between picture + name and picture only. Only for games that have pictures.
function PicturesOnlySwitch() {
  const { t } = useI18n();
  const on = usePicturesOnly();
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setPicturesOnly(!on)}
      className={`${SEGMENT_ITEM} border ${on ? `border-emerald-500/60 ${SEGMENT_ON}` : `border-line bg-ink-800 ${SEGMENT_OFF}`}`}
    >
      {t("filter.picturesOnly")}
    </button>
  );
}

// Role chips (Tank, Damage, Support...), a search box for long rosters and the pictures-only
// switch. Draws nothing for a game with none of them, so those games look as they did.
export default function RosterFilter({ game, filter, onFilter }: { game: Game; filter: Filter; onFilter: (f: Filter) => void }) {
  const { t } = useI18n();
  const search = game.characters.length >= SEARCH_FROM;
  const pictures = gameHasPortraits(game);
  if (!game.roles && !search && !pictures) return null;
  const chips = [{ label: null as string | null, text: t("filter.all") }, ...(game.roles ?? []).map((r) => ({ label: r.label, text: r.label }))];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {game.roles && (
        <div className={`${SEGMENT} max-w-full overflow-x-auto [scrollbar-width:none]`} role="group" aria-label={t("filter.label")}>
          {chips.map((c) => (
            <button
              key={c.label ?? "all"}
              type="button"
              aria-pressed={filter.role === c.label}
              onClick={() => onFilter({ ...filter, role: c.label })}
              className={`${SEGMENT_ITEM} shrink-0 ${filter.role === c.label ? SEGMENT_ON : SEGMENT_OFF}`}
            >
              {c.text}
            </button>
          ))}
        </div>
      )}
      {search && (
        <input
          type="search"
          value={filter.query}
          onChange={(e) => onFilter({ ...filter, query: e.target.value })}
          placeholder={t("filter.search")}
          aria-label={t("filter.search")}
          className={`${INPUT} w-full sm:w-56`}
        />
      )}
      {pictures && <PicturesOnlySwitch />}
    </div>
  );
}
