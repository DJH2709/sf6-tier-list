"use client";
import { useGame } from "../GameContext";
import { useI18n } from "@/lib/i18n/client";
import { rankName } from "@/lib/i18n/games";
import { INPUT } from "../ui";

type Props = {
  rank: string;
  onRank: (rank: string) => void;
  proofUrl: string;
  onProofUrl: (url: string) => void;
  // A top-rank list that was already approved goes back to being checked if it changes.
  approved: boolean;
};

// Step 1: the player's rank, plus a proof link for the ranks that need one.
export default function RankPicker({ rank, onRank, proofUrl, onProofUrl, approved }: Props) {
  const { t } = useI18n();
  const game = useGame();
  const needsProof = game.ranks.find((r) => r.id === rank)?.needsProof;
  return (
    <>
      <select
        value={rank}
        onChange={(e) => onRank(e.target.value)}
        aria-label={t("make.step1")}
        className={`${INPUT} w-full sm:w-72`}
      >
        <option value="">{t("make.chooseRank")}</option>
        {game.ranks.map((r) => <option key={r.id} value={r.id}>{rankName(game, r.id, t)}</option>)}
      </select>
      {needsProof && (
        <label className="block space-y-1 text-sm">
          <span>{t("make.proofLabel", { site: game.proofSite })}</span>
          <input
            type="url"
            inputMode="url"
            autoComplete="url"
            maxLength={300}
            value={proofUrl}
            onChange={(e) => onProofUrl(e.target.value)}
            placeholder={game.proofPlaceholder}
            className={`${INPUT} block w-full`}
          />
          <span className="block leading-5 text-ink-300">
            {t("make.proofNote")}
            {approved && ` ${t("make.proofRecheck")}`}
          </span>
        </label>
      )}
    </>
  );
}
