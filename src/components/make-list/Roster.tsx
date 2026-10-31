"use client";
import { useDroppable } from "@dnd-kit/core";
import DraggableTile from "../DraggableTile";
import { useI18n } from "@/lib/i18n/client";

// Unplaced characters. Dropping a placed character here takes them back out of the list.
export default function Roster({ ids, selected, onSelect }: { ids: string[]; selected: string | null; onSelect: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: "roster" });
  const { t } = useI18n();
  return (
    <div
      ref={setNodeRef}
      data-roster
      className={`flex min-h-14 flex-wrap gap-1.5 rounded-xl border border-dashed p-3 transition-colors
        ${isOver ? "border-emerald-500 bg-emerald-500/10" : "border-line-strong"}`}
    >
      {ids.map((id) => (
        <DraggableTile key={id} id={id} selected={selected === id} onClick={() => onSelect(id)} />
      ))}
      {ids.length === 0 && (
        <span className="self-center text-xs text-ink-400">{t("make.rosterEmpty")}</span>
      )}
    </div>
  );
}
