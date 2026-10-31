// src/lib/store.ts and the account deletion in src/lib/account.ts, through the real supabase-js
// client, with its HTTP calls answered by the real SQL files in PGlite (tests/db/).
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { freshDatabase, saveList, newUser } from "./db/supabase.mjs";
import { fakeSupabase, FAKE_KEY, FAKE_URL } from "./db/fake-supabase.mjs";

let db, fake, store, account, connection, sf6;
before(async () => {
  db = await freshDatabase();
  fake = fakeSupabase(db);
  globalThis.fetch = fake.fetch;
  // src/lib/supabase.ts reads these when it's first imported.
  process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = FAKE_KEY;
  connection = await import("@/lib/supabase");
  store = await import("@/lib/store");
  account = await import("@/lib/account");
  sf6 = (await import("@/lib/games")).GAMES.find((g) => g.id === "sf6");
});

const ids = () => sf6.characters.map((c) => c.id);
const fullList = (score) => Object.fromEntries(ids().map((id, i) => [id, ((i + score) % 5) + 1]));

test("with settings present the site is not in demo mode", () => {
  assert.equal(connection.demoMode, false);
  assert.deepEqual(connection.configFound, { url: true, key: true });
});

test("a first-time visitor's vote signs them in anonymously, saves, and shows in their lists", async () => {
  assert.deepEqual(await store.getMyLists(sf6), [], "nobody signed in yet");
  const placements = fullList(0);
  assert.deepEqual(await store.submitList(sf6, "gold", placements), { updated: false });
  assert.ok(fake.calls.some((c) => c.path === "/auth/v1/signup"), "signed in anonymously");

  const [mine] = await store.getMyLists(sf6);
  assert.equal(mine.patch, sf6.patch);
  assert.equal(mine.rank, "gold");
  assert.equal(mine.isPublic, true);
  assert.equal(mine.verification, "none");
  assert.deepEqual(mine.placements, placements);
});

test("saving again updates the same list", async () => {
  const placements = fullList(2);
  assert.deepEqual(await store.submitList(sf6, "platinum", placements, undefined, false), { updated: true });
  const lists = await store.getMyLists(sf6);
  assert.equal(lists.length, 1);
  assert.equal(lists[0].rank, "platinum");
  assert.equal(lists[0].isPublic, false);
  assert.deepEqual(lists[0].placements, placements);
});

test("a proof link is only sent for top ranks, and puts the list up for checking", async () => {
  await store.submitList(sf6, "legend", fullList(1), "https://www.streetfighter.com/6/buckler/profile/9");
  const [mine] = await store.getMyLists(sf6);
  assert.equal(mine.proofUrl, "https://www.streetfighter.com/6/buckler/profile/9");
  assert.equal(mine.verification, "pending");
});

test("getResults returns this patch's band averages, including other players' votes", async () => {
  const other = await newUser(db);
  await saveList(db, other, { patch: sf6.patch, rank: "silver", placements: { ryu: 2 } });
  await saveList(db, other, { patch: "2026-01", rank: "silver", placements: { ken: 5 } });
  const results = await store.getResults(sf6);
  const ryu = results.find((r) => r.band === "beginner" && r.item_id === "ryu");
  assert.deepEqual(ryu, { band: "beginner", item_id: "ryu", avg_score: 2, votes: 1, lists: 1 });
  // Our legend list has no approved proof, so it counts as advanced.
  assert.ok(results.some((r) => r.band === "advanced" && r.item_id === "ryu"));
  assert.ok(!results.some((r) => r.item_id === "ken" && r.band === "beginner"), "older patch left out");
});

test("a rank the database doesn't know gives an error that says what to do", async () => {
  await assert.rejects(store.submitList(sf6, "not_a_rank", fullList(0)), /doesn't know that rank/);
});

test("a bad score is refused and the saved list is kept as it was", async () => {
  const before = await store.getMyLists(sf6);
  await assert.rejects(store.submitList(sf6, "gold", { ...fullList(0), ryu: 9 }));
  assert.deepEqual(await store.getMyLists(sf6), before);
});

test("deleteAccount removes the player's lists and signs them out", async () => {
  const { supabase } = connection;
  const { data } = await supabase.auth.getSession();
  const me = data.session.user.id;
  await account.deleteAccount();
  assert.equal((await supabase.auth.getSession()).data.session, null, "signed out");
  const { rows } = await db.query("select count(*)::int as n from tier_lists where user_id = $1", [me]);
  assert.equal(rows[0].n, 0);
  assert.deepEqual(await store.getMyLists(sf6), []);
});

test("deleteAccount says so when the database doesn't have the function yet", async () => {
  await store.submitList(sf6, "gold", fullList(0)); // signs in again
  await db.exec("alter function delete_my_account() rename to delete_my_account_later");
  try {
    await assert.rejects(account.deleteAccount(), { message: "account.deleteNotReady" });
  } finally {
    await db.exec("alter function delete_my_account_later() rename to delete_my_account");
  }
});
