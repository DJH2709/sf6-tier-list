// The list maker's rules, kept apart from the screen so tests/make-list.test.mjs can check them.
import type { Character } from "@/lib/games";
import type { MyList, Placements } from "@/lib/store";

// The character to place next: the first one on the roster that isn't placed yet.
export function nextUnplaced(characters: Character[], placements: Placements): string | null {
  return characters.find((c) => !(c.id in placements))?.id ?? null;
}

// Which saved list to start from: this patch's (editing it), or else the newest older one
// (copied as a starting point). Lists come newest first, as getMyLists returns them.
export function startingList(lists: MyList[], patch: string): { from: MyList; editing: boolean } | null {
  const current = lists.find((l) => l.patch === patch);
  const from = current ?? lists.find((l) => l.patch !== patch);
  return from ? { from, editing: !!current } : null;
}

// Characters that left the roster since a list was saved are dropped. Ones that joined since
// stay unplaced.
export function keepKnown(characters: Character[], placements: Placements): Placements {
  const known = new Set(characters.map((c) => c.id));
  return Object.fromEntries(Object.entries(placements).filter(([id]) => known.has(id)));
}

// A list's order is the order of its keys (insertion order, which JSON, sessionStorage and the
// database's sort_index all keep). Each tier row shows its characters in that order.
//
// Puts `id` into tier `score`, just before `beforeId` when that character is in the same tier,
// otherwise at the end of the tier. Moving a character onto its own tier with no target leaves
// the list as it is, so tapping the row it's already in doesn't shuffle it to the end.
export function moveTo(placements: Placements, id: string, score: number, beforeId?: string | null): Placements {
  if (beforeId === id) return placements;
  const target = beforeId && placements[beforeId] === score ? beforeId : null;
  if (!target && placements[id] === score) return placements;
  const rest = Object.entries(placements).filter(([k]) => k !== id);
  const at = target ? rest.findIndex(([k]) => k === target) : rest.length;
  rest.splice(at, 0, [id, score]);
  return Object.fromEntries(rest);
}
