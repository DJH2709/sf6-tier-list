"use client";
import { useI18n } from "@/lib/i18n/client";
import { getGame } from "@/lib/games";
import type { Profile } from "@/lib/profiles";

const TAGS = {
  pro: { label: "tag.pro", title: "tag.proTitle" },
  influencer: { label: "tag.creator", title: "tag.creatorTitle" },
  coach: { label: "tag.coach", title: "tag.coachTitle" },
} as const;

// Tags are given out by hand, so a player can't claim one. Quiet text, not a badge. The game
// is part of the label, not only the hover text, because most visitors are on phones.
export default function ProfileTag({ profile }: { profile: Pick<Profile, "tag" | "tag_game"> }) {
  const { t } = useI18n();
  const { tag } = profile;
  if (!tag || !TAGS[tag]) return null;
  const { label, title } = TAGS[tag];
  const game = profile.tag_game ? getGame(profile.tag_game) : undefined;
  return (
    <span title={t(title)} className="inline-flex h-5 items-center rounded border border-line-strong px-1.5 align-middle font-mono text-[11px] leading-none text-ink-300">
      {t(label)}
      {game && <span className="text-ink-400">&nbsp;·&nbsp;{game.short}</span>}
    </span>
  );
}
