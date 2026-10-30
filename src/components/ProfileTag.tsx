"use client";
import { useI18n } from "@/lib/i18n/client";
import type { ProfileTag as Tag } from "@/lib/profiles";

const TAGS = {
  pro: { label: "tag.pro", title: "tag.proTitle", className: "bg-lime-400 text-neutral-950" },
  influencer: { label: "tag.influencer", title: "tag.influencerTitle", className: "bg-violet-500 text-white" },
} as const;

// Tags are given out by hand, so a player can't claim one.
export default function ProfileTag({ tag }: { tag: Tag | null }) {
  const { t } = useI18n();
  if (!tag || !TAGS[tag]) return null;
  const { label, title, className } = TAGS[tag];
  return (
    <span title={t(title)} className={`rounded-full px-2 py-0.5 align-middle text-xs font-bold uppercase tracking-wide ${className}`}>
      {t(label)}
    </span>
  );
}
