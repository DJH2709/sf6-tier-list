// Things only the site owner may do (pro/influencer tags, approving a top-rank list) and things
// a player may only do to their own account. Run against the real supabase/*.sql files with a
// valid but hostile session. No site code is involved, so these hold even if someone edits the
// site's JavaScript in their own browser or calls Supabase directly.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { freshDatabase, newUser, saveList, as } from "./db/supabase.mjs";

const PATCH = "2026-10";
let db, alice, bob, anonVoter;
const refused = (p, what) => assert.rejects(p, (e) => e.code === "42501", what);

before(async () => {
  db = await freshDatabase();
  alice = await newUser(db);
  bob = await newUser(db);
  anonVoter = await newUser(db, { anonymous: true });
  await as(db, alice, "insert into profiles (username) values ('alice')");
  await as(db, bob, "insert into profiles (username) values ('bob')");
  await saveList(db, alice, { patch: PATCH, rank: "legend", proofUrl: "https://example.com/alice", placements: { ryu: 5 } });
});

test("a player can't give themselves a pro or influencer tag", async () => {
  await refused(as(db, alice, "update profiles set tag = 'pro' where id = auth.uid()"), "update");
  const carl = await newUser(db);
  await refused(as(db, carl, "insert into profiles (username, tag) values ('carl', 'influencer')"), "insert");
});

test("a player can't approve their own top-rank list", async () => {
  await refused(as(db, alice, "update tier_lists set verification = 'approved' where user_id = auth.uid()"), "update");
  await refused(
    as(db, alice, "insert into tier_lists (game, patch, claimed_rank, verification) values ('sf6', '2026-09', 'legend', 'approved')"),
    "insert",
  );
  const { rows } = await db.query("select verification from tier_lists where user_id = $1", [alice.id]);
  assert.deepEqual(rows, [{ verification: "pending" }], "save_list leaves a proven top rank pending");
});

test("a player can't change another player's profile or lists", async () => {
  const r = await as(db, alice, "update profiles set display_name = 'hacked' where username = 'bob'");
  assert.equal(r.affectedRows, 0);
  await refused(as(db, alice, "delete from tier_placements"), "placements");
  await assert.rejects(as(db, alice, "insert into follows (follower_id, followee_id) values ($1, $2)", [bob.id, alice.id]));
});

test("rank ladders and raw bands can't be touched from the browser", async () => {
  await refused(as(db, alice, "update game_ranks set band = 'elite'"), "game_ranks");
  await refused(as(db, alice, "select * from list_bands"), "list_bands");
});

test("signed-out visitors and anonymous voters get no account powers", async () => {
  await refused(as(db, null, "insert into profiles (id, username) values (gen_random_uuid(), 'nobody')"), "anon insert");
  await assert.rejects(as(db, null, "select delete_my_account()"));
  await assert.rejects(as(db, anonVoter, "insert into profiles (username) values ('anonvoter')"), "anonymous profile");
});
