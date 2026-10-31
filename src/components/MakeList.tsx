"use client";
import { useEffect, useRef, useState } from "react";
import { getMyLists, submitList, type MyList, type Placements } from "@/lib/store";
import type { Profile } from "@/lib/account";
import Step from "./make-list/Step";
import RankPicker from "./make-list/RankPicker";
import PlaceCharacters from "./make-list/PlaceCharacters";
import { keepKnown, nextUnplaced, startingList } from "./make-list/placements";
import { useGame } from "./GameContext";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "@/lib/i18n/config";
import { clearDraft, isEmptyDraft, loadDraft, saveDraft } from "@/lib/draft";
import { BTN_LG, BTN_PRIMARY, NOTE } from "./ui";
import { NO_FILTER, shown, type Filter } from "./RosterFilter";

type Props = {
  profile: Profile | null;
  onSubmitted: (result: { isPublic: boolean; updated: boolean }) => void;
};

export default function MakeList({ profile, onSubmitted }: Props) {
  const { t, nameOf } = useI18n();
  const game = useGame();
  const CHARACTERS = game.characters;
  const [filter, setFilter] = useState<Filter>(NO_FILTER);
  const [placements, setPlacements] = useState<Placements>({});
  const [selected, setSelected] = useState<string | null>(CHARACTERS[0].id);
  const [rank, setRank] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  // The list already saved for this patch (editing), or the patch an older list was copied from.
  const [existing, setExisting] = useState<MyList | null>(null);
  const [basedOn, setBasedOn] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  // Don't overwrite placements the player made while their saved list was still loading.
  const touched = useRef(false);

  // The first run of the draft-saving effect is the initial render, which must not be saved.
  const firstSave = useRef(true);

  // Unsaved work from earlier in this tab (Back button, a reload, a detour to a profile) comes
  // back first and counts as the player's own edits, so the saved list can't overwrite it.
  useEffect(() => {
    const draft = loadDraft(game.id, game.patch);
    if (draft && !isEmptyDraft(draft)) {
      const valid = Object.fromEntries(Object.entries(draft.placements).filter(([, score]) => Number.isInteger(score) && score >= 1 && score <= 5));
      const kept = keepKnown(CHARACTERS, valid);
      touched.current = true;
      setPlacements(kept);
      setSelected(nextUnplaced(CHARACTERS, kept));
      setRank(game.ranks.some((r) => r.id === draft.rank) ? draft.rank : "");
      setProofUrl(draft.proofUrl);
      setIsPublic(draft.isPublic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getMyLists(game).then((lists) => {
      const start = startingList(lists, game.patch);
      if (!start) return;
      const { from, editing } = start;
      // The player already has a list for this patch, so the button says "Update" even while
      // a draft or their own edits are on screen.
      if (editing) setExisting(from);
      if (touched.current) return;
      const kept = keepKnown(CHARACTERS, from.placements);
      setPlacements(kept);
      setSelected(nextUnplaced(CHARACTERS, kept));
      setRank(from.rank);
      setProofUrl(from.proofUrl ?? "");
      setIsPublic(from.isPublic);
      if (!editing) setBasedOn(from.patch);
    }, (e) => setStatus({ text: errorText(e, t), error: true }));
    // Runs once per game (the page remounts on a new game); t only changes the wording of an error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the draft in step with the form.
  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    const draft = { placements, rank, proofUrl, isPublic };
    if (isEmptyDraft(draft)) clearDraft(game.id, game.patch);
    else saveDraft(game.id, game.patch, draft);
  }, [placements, rank, proofUrl, isPublic, game.id, game.patch]);

  const unplacedCount = CHARACTERS.filter((c) => !(c.id in placements)).length;
  // Big rosters (Clash Royale's cards) only ask for some, so nobody has to rate cards they never use.
  const placedCount = CHARACTERS.length - unplacedCount;
  const minPlaced = Math.min(game.minPlaced ?? CHARACTERS.length, CHARACTERS.length);
  const stillToPlace = Math.max(0, minPlaced - placedCount);
  const needsProof = game.ranks.find((r) => r.id === rank)?.needsProof;

  function place(id: string, score: number) {
    touched.current = true;
    const next = { ...placements, [id]: score };
    setPlacements(next);
    // Stay inside the role or search the player picked, then carry on with the rest.
    const visible = CHARACTERS.filter((c) => shown(game, c.id, nameOf(c.id, game), filter));
    setSelected(nextUnplaced(visible, next) ?? nextUnplaced(CHARACTERS, next));
  }

  function changeFilter(f: Filter) {
    setFilter(f);
    const visible = CHARACTERS.filter((c) => shown(game, c.id, nameOf(c.id, game), f));
    const first = nextUnplaced(visible, placements);
    if (first) setSelected(first);
  }

  function unplace(id: string) {
    touched.current = true;
    const next = { ...placements };
    delete next[id];
    setPlacements(next);
    setSelected(id);
  }

  function startOver() {
    touched.current = true;
    setPlacements({});
    setSelected(CHARACTERS[0].id);
  }

  async function submit() {
    setSaving(true);
    setStatus(null);
    try {
      const { updated } = await submitList(game, rank, placements, needsProof ? proofUrl : undefined, isPublic);
      setStatus({ text: t(updated ? "make.updated" : "make.thanks") });
      clearDraft(game.id, game.patch);
      setExisting((e) => e ?? { id: "", patch: game.patch, rank, proofUrl: proofUrl || null, verification: "none", isPublic, placements });
      setBasedOn(null);
      onSubmitted({ isPublic, updated });
    } catch (e) {
      setStatus({ text: errorText(e, t), error: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {existing && (
        <p className={NOTE}>
          {t("make.editing", { patch: game.patch })}
        </p>
      )}
      {basedOn && (
        <p className={NOTE}>
          {t("make.newPatch", { patch: basedOn })}
        </p>
      )}

      <Step n={1} title={t("make.step1")}>
        <RankPicker
          rank={rank}
          onRank={setRank}
          proofUrl={proofUrl}
          onProofUrl={setProofUrl}
          approved={existing?.verification === "approved"}
        />
      </Step>

      <Step n={2} title={t("make.step2")}>
        <PlaceCharacters
          placements={placements}
          selected={selected}
          onSelect={setSelected}
          onPlace={place}
          onUnplace={unplace}
          onStartOver={startOver}
          filter={filter}
          onFilter={changeFilter}
        />
        {minPlaced < CHARACTERS.length && <p className="text-sm leading-5 text-ink-300">{t("make.partial", { n: minPlaced })}</p>}
      </Step>

      <Step n={3} title={t("make.step3")}>
        {profile && (
          <label className="flex min-h-6 items-center gap-2 text-sm leading-5">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 shrink-0 accent-emerald-500" />
            {t("make.showOnProfile", { username: profile.username })}
          </label>
        )}
        <button
          type="button"
          disabled={!rank || stillToPlace > 0 || saving}
          onClick={submit}
          className={`${BTN_PRIMARY} ${BTN_LG} w-full sm:w-auto`}
        >
          {saving ? t("make.saving") : !rank ? t("make.chooseRankFirst") : stillToPlace > 0 ? t("make.placeMore", { n: stillToPlace }) : t(existing ? "make.update" : "make.submit")}
        </button>
        {status && <p className={`text-sm ${status.error ? "text-red-300" : "text-emerald-300"}`}>{status.text}</p>}
      </Step>
    </div>
  );
}
