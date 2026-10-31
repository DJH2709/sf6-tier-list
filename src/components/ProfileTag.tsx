"use client";
import { useI18n } from "@/lib/i18n/client";
import type { ProfileTag as Tag } from "@/lib/profiles";

const TAGS = {
  pro: { label: "tag.pro", title: "tag.proTitle" },
  influencer: { label: "tag.influencer", title: "tag.influencerTitle" },
} as const;

// Tags are given out by hand, so a player can't claim one. Quiet text, not a badge.
export default function ProfileTag({ tag }: { tag: Tag | null }) {
  const { t } = useI18n();
  if (!tag || !TAGS[tag]) return null;
  const { label, title } = TAGS[tag];
  return (
    <span title={t(title)} className="inline-flex h-5 items-center rounded border border-line-strong px-1.5 align-middle font-mono text-[11px] leading-none text-ink-300">
      {t(label)}
    </span>
  );
}
