// With no Supabase settings the site saves to this browser only (src/lib/store.ts demo mode).
import { test, before } from "node:test";
import assert from "node:assert/strict";

let store, connection, sf6;
before(async () => {
  for (const k of Object.keys(process.env)) if (k.startsWith("NEXT_PUBLIC_SUPABASE") || k === "NEXT_PUBLIC_VERCEL_ENV") delete process.env[k];
  const data = new Map();
  globalThis.localStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, String(v)),
  };
  connection = await import("@/lib/supabase");
  store = await import("@/lib/store");
  sf6 = (await import("@/lib/games")).GAMES.find((g) => g.id === "sf6");
});

test("no settings means demo mode, and not the deployed-without-settings error", () => {
  assert.equal(connection.supabase, null);
  assert.equal(connection.demoMode, true);
  assert.equal(connection.missingConfig, false);
});

test("one list per patch: the second save replaces the first", async () => {
  assert.deepEqual(await store.submitList(sf6, "gold", { ryu: 5, ken: 1 }), { updated: false });
  assert.deepEqual(await store.submitList(sf6, "diamond", { ryu: 3 }), { updated: true });
  const lists = await store.getMyLists(sf6);
  assert.equal(lists.length, 1);
  assert.equal(lists[0].rank, "diamond");
  assert.deepEqual(lists[0].placements, { ryu: 3 });
  assert.deepEqual(await store.getResults(sf6), [{ band: "intermediate", item_id: "ryu", avg_score: 3, votes: 1, lists: 1 }]);
});

test("lists from an older patch are kept but left out of the results", async () => {
  localStorage.setItem("sf6-demo-lists", JSON.stringify([
    { patch: sf6.patch, rank: "platinum", placements: { ryu: 4 } },
    { patch: "2020-01", rank: "platinum", placements: { ryu: 1 } },
  ]));
  assert.equal((await store.getMyLists(sf6)).length, 2);
  assert.deepEqual(await store.getResults(sf6), [{ band: "intermediate", item_id: "ryu", avg_score: 4, votes: 1, lists: 1 }]);
  assert.deepEqual(await store.submitList(sf6, "platinum", { ryu: 2 }), { updated: true });
  assert.deepEqual((await store.getMyLists(sf6)).map((l) => l.patch), [sf6.patch, "2020-01"]);
});

test("broken saved data doesn't break the page", async () => {
  localStorage.setItem("sf6-demo-lists", "{not json");
  assert.deepEqual(await store.getMyLists(sf6), []);
  assert.deepEqual(await store.getResults(sf6), []);
});
