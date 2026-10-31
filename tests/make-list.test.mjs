// The list maker's rules (src/components/make-list/placements.ts): what's selected next, and
// which saved list the page starts from.
import { test } from "node:test";
import assert from "node:assert/strict";
import { keepKnown, nextUnplaced, startingList } from "@/components/make-list/placements";

const roster = [{ id: "ryu", name: "Ryu" }, { id: "ken", name: "Ken" }, { id: "luke", name: "Luke" }];
const list = (patch, placements = {}) => ({ id: patch, patch, rank: "gold", proofUrl: null, verification: "none", isPublic: true, placements });

test("the next character to place is the first unplaced one on the roster", () => {
  assert.equal(nextUnplaced(roster, {}), "ryu");
  assert.equal(nextUnplaced(roster, { ryu: 5 }), "ken");
  assert.equal(nextUnplaced(roster, { ryu: 5, ken: 1 }), "luke");
  assert.equal(nextUnplaced(roster, { ryu: 5, ken: 1, luke: 3 }), null);
});

test("this patch's list is edited; otherwise the newest older list is copied", () => {
  assert.equal(startingList([], "2026-10"), null);
  assert.deepEqual(startingList([list("2026-10"), list("2026-07")], "2026-10"), { from: list("2026-10"), editing: true });
  assert.deepEqual(startingList([list("2026-07"), list("2026-01")], "2026-10"), { from: list("2026-07"), editing: false });
});

test("characters no longer on the roster are dropped from a copied list", () => {
  assert.deepEqual(keepKnown(roster, { ryu: 5, oro: 2, luke: 1 }), { ryu: 5, luke: 1 });
});
