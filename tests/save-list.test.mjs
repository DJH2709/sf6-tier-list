// Saving a tier list, run against the real supabase/*.sql files (see tests/db/supabase.mjs).
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { freshDatabase, newUser, saveList, as } from "./db/supabase.mjs";

const PATCH = "2026-10";
let db;
before(async () => {
  db = await freshDatabase();
});

// What's stored for this player, read as the database owner.
async function stored(user) {
  const { rows } = await db.query(
    `select l.patch, l.claimed_rank, l.verification, l.proof_url, l.is_public,
       coalesce(jsonb_object_agg(p.item_id, p.score) filter (where p.item_id is not null), '{}') as placements
     from tier_lists l left join tier_placements p on p.list_id = l.id
     where l.user_id = $1 group by l.id order by l.patch`,
    [user.id],
  );
  return rows;
}

test("the first save creates a list; saving again replaces it, never merges", async () => {
  const u = await newUser(db, { anonymous: true });
  assert.equal(await saveList(db, u, { patch: PATCH, rank: "gold", placements: { ryu: 5, luke: 3, jamie: 1 } }), false);
  assert.equal(await saveList(db, u, { patch: PATCH, rank: "platinum", placements: { ryu: 2, luke: 4 } }), true);
  const lists = await stored(u);
  assert.equal(lists.length, 1, "one list per player per patch");
  assert.equal(lists[0].claimed_rank, "platinum");
  assert.deepEqual(lists[0].placements, { ryu: 2, luke: 4 }, "jamie from the old save must be gone");
});

test("each patch keeps its own list", async () => {
  const u = await newUser(db);
  await saveList(db, u, { patch: "2026-07", rank: "gold", placements: { ryu: 1 } });
  assert.equal(await saveList(db, u, { patch: PATCH, rank: "gold", placements: { ryu: 5 } }), false);
  assert.deepEqual((await stored(u)).map((l) => [l.patch, l.placements.ryu]), [["2026-07", 1], [PATCH, 5]]);
});

test("a bad save changes nothing, so a list is never left half replaced", async () => {
  const u = await newUser(db);
  await saveList(db, u, { patch: PATCH, rank: "gold", placements: { ryu: 5, luke: 3 } });
  const before = await stored(u);
  const bad = [
    [{ rank: "gold", placements: { ryu: 6 } }, "23514"], // score above 5
    [{ rank: "gold", placements: { ryu: 0 } }, "23514"], // score below 1
    [{ rank: "gold", placements: { "Ryu!": 3 } }, "23514"], // item id format
    [{ rank: "not_a_rank", placements: { ryu: 3 } }, "22023"],
    [{ rank: "gold", placements: Object.fromEntries(Array.from({ length: 151 }, (_, i) => [`c${i}`, 3])) }, "22023"],
    [{ game: "Not A Game", rank: "gold", placements: { ryu: 3 } }, "22023"], // no ladder for it
    [{ patch: "next week", rank: "gold", placements: { ryu: 3 } }, "23514"],
    [{ rank: "gold", proofUrl: "javascript:alert(1)", placements: { ryu: 3 } }, "23514"],
  ];
  for (const [input, code] of bad) {
    await assert.rejects(saveList(db, u, { patch: PATCH, ...input }), (e) => e.code === code, JSON.stringify(input));
  }
  assert.deepEqual(await stored(u), before);
});

test("players can only write through save_list, and only to their own list", async () => {
  const u = await newUser(db);
  const other = await newUser(db);
  await saveList(db, other, { patch: PATCH, rank: "gold", placements: { ryu: 5 } });
  const { rows: [{ id: otherList }] } = await db.query("select id from tier_lists where user_id = $1", [other.id]);
  const direct = [
    ["insert into tier_lists (game, patch, claimed_rank) values ('sf6', $1, 'gold')", [PATCH]],
    ["update tier_lists set claimed_rank = 'legend' where id = $1", [otherList]],
    ["delete from tier_placements where list_id = $1", [otherList]],
    ["insert into tier_placements (list_id, item_id, score) values ($1, 'ryu', 1)", [otherList]],
    ["update tier_lists set verification = 'approved' where id = $1", [otherList]],
  ];
  for (const [sql, params] of direct) {
    await assert.rejects(as(db, u, sql, params), (e) => e.code === "42501", sql);
  }
  // Saving touches the caller's list only.
  await saveList(db, u, { patch: PATCH, rank: "gold", placements: { ryu: 1 } });
  assert.deepEqual((await stored(other))[0].placements, { ryu: 5 });
});

test("signed-out visitors can't save", async () => {
  await assert.rejects(saveList(db, null, { patch: PATCH, rank: "gold", placements: { ryu: 3 } }), (e) => e.code === "42501");
});

test("top ranks with a proof link wait for a check; changing the rank or link re-opens it", async () => {
  const u = await newUser(db);
  await saveList(db, u, { patch: PATCH, rank: "grand_master", placements: { ryu: 5 } });
  assert.equal((await stored(u))[0].verification, "none", "no proof link, nothing to check");

  const proofUrl = "https://www.streetfighter.com/6/buckler/profile/123";
  await saveList(db, u, { patch: PATCH, rank: "grand_master", proofUrl, placements: { ryu: 5 } });
  assert.equal((await stored(u))[0].verification, "pending");

  // The site owner approves it by hand.
  await db.query("update tier_lists set verification = 'approved' where user_id = $1", [u.id]);
  await saveList(db, u, { patch: PATCH, rank: "grand_master", proofUrl, placements: { ryu: 4 } });
  assert.equal((await stored(u))[0].verification, "approved", "re-placing characters keeps the approval");

  await saveList(db, u, { patch: PATCH, rank: "legend", proofUrl, placements: { ryu: 4 } });
  assert.equal((await stored(u))[0].verification, "pending", "a new rank needs checking again");
  await saveList(db, u, { patch: PATCH, rank: "gold", placements: { ryu: 4 } });
  assert.equal((await stored(u))[0].verification, "none");
});

test("a private list is hidden from other players but its owner still sees it", async () => {
  const u = await newUser(db);
  await as(db, u, "insert into profiles (username) values ('private_pat')");
  await saveList(db, u, { patch: PATCH, rank: "gold", isPublic: false, placements: { ryu: 5 } });
  const viewer = await newUser(db);
  const count = async (who) =>
    (await as(db, who, "select count(*)::int as n from tier_lists where user_id = $1", [u.id])).rows[0].n;
  assert.equal(await count(u), 1);
  assert.equal(await count(viewer), 0);
  assert.equal(await count(null), 0);
  await saveList(db, u, { patch: PATCH, rank: "gold", isPublic: true, placements: { ryu: 5 } });
  assert.equal(await count(viewer), 1);
  assert.equal(await count(null), 1);
});
