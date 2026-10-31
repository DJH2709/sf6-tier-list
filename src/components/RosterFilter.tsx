"use client";
import type { Game } from "@/lib/games";
import { SEARCH_FROM } from "@/lib/games";
import { useI18n } from "@/lib/i18n/client";
import { INPUT, SEGMENT, SEGMENT_ITEM, SEGMENT_OFF, SEGMENT_ON } from "./ui";

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

// Role chips (Tank, Damage, Support...) and a search box for long rosters. Draws nothing for a
// game with neither, so the fighting games look as they did.
export default function RosterFilter({ game, filter, onFilter }: { game: Game; filter: Filter; onFilter: (f: Filter) => void }) {
  const { t } = useI18n();
  const search = game.characters.length >= SEARCH_FROM;
  if (!game.roles && !search) return null;
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
    </div>
  );
}
