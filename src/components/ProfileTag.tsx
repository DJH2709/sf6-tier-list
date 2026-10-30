import type { ProfileTag as Tag } from "@/lib/profiles";

const TAGS: Record<Tag, { label: string; title: string; className: string }> = {
  pro: { label: "Pro", title: "Competes at a professional level", className: "bg-lime-400 text-neutral-950" },
  influencer: { label: "Influencer", title: "Makes Street Fighter content", className: "bg-violet-500 text-white" },
};

// Tags are given out by hand, so a player can't claim one.
export default function ProfileTag({ tag }: { tag: Tag | null }) {
  if (!tag || !TAGS[tag]) return null;
  const { label, title, className } = TAGS[tag];
  return (
    <span title={title} className={`rounded-full px-2 py-0.5 align-middle text-xs font-bold uppercase tracking-wide ${className}`}>
      {label}
    </span>
  );
}
