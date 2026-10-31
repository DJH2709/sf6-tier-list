"use client";
import type { Band, Game } from "@/lib/games";
import { useI18n } from "@/lib/i18n/client";
import { rankName } from "@/lib/i18n/games";

// The site's one signature detail: a small mono chip in the band's own muted colour, next
// to every list and in the band picker, so a rank reads the same everywhere.
const BAND_STYLE: Record<Band, string> = {
  beginner: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  intermediate: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  advanced: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  elite: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

export default function RankChip({ band, children, className = "" }: { band: Band; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex h-5 items-center whitespace-nowrap rounded border px-1.5 font-mono text-[11px] leading-none ${BAND_STYLE[band]} ${className}`}>
      {children}
    </span>
  );
}

export function bandOf(game: Game, rankId: string): Band {
  return game.ranks.find((r) => r.id === rankId)?.band ?? "beginner";
}

// "Voted as {rank}" in any language, with the rank shown as a chip wherever the sentence puts it.
export function VotedAs({ game, rankId }: { game: Game; rankId: string }) {
  const { t } = useI18n();
  const [before, after = ""] = t("profile.votedAs", { rank: "{rank}" }).split("{rank}");
  return (
    <>
      {before}
      <RankChip band={bandOf(game, rankId)} className="align-middle">{rankName(game, rankId, t)}</RankChip>
      {after}
    </>
  );
}
