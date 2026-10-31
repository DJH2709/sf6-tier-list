// Keeps an unsaved tier list in the browser tab while the player is away from the page, so
// pressing Back, following a profile link or reloading doesn't wipe what they placed.
// sessionStorage lives for the tab only; the saved list in the database is the real copy.
import type { Placements } from "@/lib/store";

export type Draft = { placements: Placements; rank: string; proofUrl: string; isPublic: boolean };

const key = (gameId: string, patch: string) => `draft:${gameId}:${patch}`;

function storage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null; // storage blocked by the browser's settings
  }
}

export function loadDraft(gameId: string, patch: string): Draft | null {
  try {
    const raw = storage()?.getItem(key(gameId, patch));
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object" || typeof d.placements !== "object" || d.placements === null) return null;
    return { placements: d.placements, rank: String(d.rank ?? ""), proofUrl: String(d.proofUrl ?? ""), isPublic: d.isPublic !== false };
  } catch {
    return null;
  }
}

export function saveDraft(gameId: string, patch: string, draft: Draft) {
  try {
    storage()?.setItem(key(gameId, patch), JSON.stringify(draft));
  } catch {
    // Storage full or blocked: the page still works, the draft just isn't kept.
  }
}

export function clearDraft(gameId: string, patch: string) {
  try {
    storage()?.removeItem(key(gameId, patch));
  } catch {
    // nothing to clear
  }
}

// Nothing placed and no rank chosen is not worth keeping.
export function isEmptyDraft(d: Draft) {
  return Object.keys(d.placements).length === 0 && !d.rank;
}
