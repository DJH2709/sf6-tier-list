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
