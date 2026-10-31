// Launch check 6.3: an unsaved tier list survives Back, a reload or a detour to another page.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { loadDraft, saveDraft, clearDraft, isEmptyDraft } from "@/lib/draft";

// A stand-in for the browser's sessionStorage.
const store = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
beforeEach(() => store.clear());

const draft = { placements: { ryu: 5, ken: 3 }, rank: "gold", proofUrl: "", isPublic: true };

test("a draft comes back exactly as saved, per game and patch", () => {
  saveDraft("sf6", "2026-10", draft);
  assert.deepEqual(loadDraft("sf6", "2026-10"), draft);
  assert.equal(loadDraft("sf6", "2026-11"), null, "another patch has no draft");
  assert.equal(loadDraft("tekken8", "2026-10"), null, "another game has no draft");
});

test("clearing removes it", () => {
  saveDraft("sf6", "2026-10", draft);
  clearDraft("sf6", "2026-10");
  assert.equal(loadDraft("sf6", "2026-10"), null);
});

test("damaged or hostile storage is ignored rather than crashing the page", () => {
  store.set("draft:sf6:2026-10", "{not json");
  assert.equal(loadDraft("sf6", "2026-10"), null);
  store.set("draft:sf6:2026-10", JSON.stringify({ placements: "nope" }));
  assert.equal(loadDraft("sf6", "2026-10"), null);
  store.set("draft:sf6:2026-10", JSON.stringify({ placements: { ryu: 5 } }));
  assert.deepEqual(loadDraft("sf6", "2026-10"), { placements: { ryu: 5 }, rank: "", proofUrl: "", isPublic: true });
});

test("nothing placed and no rank is not worth keeping", () => {
  assert.equal(isEmptyDraft({ placements: {}, rank: "", proofUrl: "", isPublic: true }), true);
  assert.equal(isEmptyDraft({ placements: {}, rank: "gold", proofUrl: "", isPublic: true }), false);
  assert.equal(isEmptyDraft({ placements: { ryu: 1 }, rank: "", proofUrl: "", isPublic: true }), false);
});

test("a storage that throws (private mode, blocked) is treated as absent", () => {
  globalThis.sessionStorage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  assert.doesNotThrow(() => saveDraft("sf6", "2026-10", draft));
  assert.equal(loadDraft("sf6", "2026-10"), null);
  assert.doesNotThrow(() => clearDraft("sf6", "2026-10"));
});
