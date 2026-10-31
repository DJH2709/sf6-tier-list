"use client";
import { MIN_LISTS, TIERS, type Band, type Game } from "@/lib/games";
import type { BandResult } from "@/lib/store";
import { useI18n } from "@/lib/i18n/client";
import type { MessageKey } from "@/locales/en";
import { TIER_COLOURS } from "./TierRows";
import { Portrait } from "./CharacterTile";
import RankChip from "./RankChip";
import { useGame } from "./GameContext";

const SHOWN: Band[] = ["beginner", "elite"];
const MAX_TILES = 12;

// Until each band has enough votes, the preview shows the first ten characters placed so the
// two columns visibly disagree. The caption says it's an example.
function example(game: Game, band: Band): Record<string, number> {
  const ids = game.characters.slice(0, 10).map((c) => c.id);
  const pattern = band === "beginner" ? [5, 5, 4, 4, 3, 3, 3, 2, 2, 1] : [3, 5, 2, 4, 5, 4, 1, 3, 4, 2];
  return Object.fromEntries(ids.map((id, i) => [id, pattern[i]]));
}

function live(game: Game, results: BandResult[], band: Band): Record<string, number> {
  const roster = new Set(game.characters.map((c) => c.id));
  const rows = results.filter((r) => r.band === band && roster.has(r.item_id)).sort((a, b) => b.avg_score - a.avg_score);
  return Object.fromEntries(rows.slice(0, MAX_TILES).map((r) => [r.item_id, Math.round(r.avg_score)]));
}

// The hero's visual: the product itself. Beginner and Elite lists for the same roster, side by
// side, so "changes with your rank" is shown rather than said.
export default function HeroPreview({ results }: { results: BandResult[] }) {
  const game = useGame();
  const { t } = useI18n();
  const isLive = SHOWN.every((b) => (results.find((r) => r.band === b)?.lists ?? 0) >= MIN_LISTS);

  return (
    <figure className="rounded-xl border border-line bg-ink-800 p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-3">
        {SHOWN.map((band) => {
          const placements = isLive ? live(game, results, band) : example(game, band);
          return (
            <div key={band} className="space-y-2">
              <RankChip band={band}>{t(`band.${band}` as MessageKey)}</RankChip>
              <div className="overflow-hidden rounded-lg border border-line bg-ink-900">
                {TIERS.map((tier) => (
                  <div key={tier.label} className="flex min-h-9 border-b border-line last:border-b-0">
                    <div className={`${TIER_COLOURS[tier.label]} flex w-7 shrink-0 items-center justify-center text-xs font-semibold text-ink-950`}>
                      {tier.label}
                    </div>
                    <div className="flex flex-1 flex-wrap content-start gap-1 p-1">
                      {Object.entries(placements)
                        .filter(([, score]) => score === tier.score)
                        .map(([id]) => <Portrait key={id} id={id} size="h-6 w-6" px={24} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 font-mono text-xs text-ink-400">
        {isLive ? t("home.previewLive", { patch: game.patch }) : t("home.previewExample", { min: MIN_LISTS })}
      </figcaption>
    </figure>
  );
}
