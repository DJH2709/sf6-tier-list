// "Delete my account" (supabase/007_delete_account.sql), run against the real SQL files.
// The privacy page promises it removes the profile, lists, likes and follows.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { freshDatabase, newUser, saveList, as } from "./db/supabase.mjs";

const PATCH = "2026-10";
let db;
before(async () => {
  db = await freshDatabase();
});

// A player with a profile, a public list for two games, follows and likes both ways.
async function setUpPair(a, b) {
  const players = [];
  for (const name of [a, b]) {
    const u = await newUser(db);
    await as(db, u, "insert into profiles (username) values ($1)", [name]);
    await saveList(db, u, { patch: PATCH, rank: "gold", placements: { ryu: 5, ken: 4 } });
    await saveList(db, u, { game: "tekken8", patch: PATCH, rank: "beginner", placements: { jin: 3 } });
    players.push(u);
  }
  const [x, y] = players;
  for (const [from, to] of [[x, y], [y, x]]) {
    await as(db, from, "insert into follows (followee_id) values ($1)", [to.id]);
    await as(db, from, "insert into list_likes (list_id) select id from tier_lists where user_id = $1", [to.id]);
  }
  return players;
}

// Rows anywhere that still point at this player, counted as the database owner.
async function traces(user) {
  const { rows: [r] } = await db.query(
    `select
       (select count(*) from auth.users where id = $1)::int as users,
       (select count(*) from profiles where id = $1)::int as profiles,
       (select count(*) from tier_lists where user_id = $1)::int as lists,
       (select count(*) from tier_placements p join tier_lists l on l.id = p.list_id where l.user_id = $1)::int as placements,
       (select count(*) from follows where follower_id = $1 or followee_id = $1)::int as follows,
       (select count(*) from list_likes k left join tier_lists l on l.id = k.list_id
          where k.user_id = $1 or l.user_id = $1)::int as likes`,
    [user.id],
  );
  return r;
}

const NOTHING = { users: 0, profiles: 0, lists: 0, placements: 0, follows: 0, likes: 0 };

test("deleting an account removes everything that was theirs", async () => {
  const [gone, stays] = await setUpPair("deleting_dee", "staying_sam");
  const before = await traces(stays);
  assert.deepEqual(await traces(gone), { users: 1, profiles: 1, lists: 2, placements: 3, follows: 2, likes: 4 });

  await as(db, gone, "select delete_my_account()");

  assert.deepEqual(await traces(gone), NOTHING);
  // The other player keeps their own account, lists and placements; only the follows and
  // likes involving the deleted player go.
  const after = await traces(stays);
  assert.deepEqual(after, { ...before, follows: 0, likes: 0 });
});

test("the results lose the deleted player's votes", async () => {
  const solo = await newUser(db, { anonymous: true });
  await saveList(db, solo, { patch: "2026-01", rank: "silver", placements: { dhalsim: 2 } });
  const votes = async () =>
    (await as(db, null, "select coalesce(sum(votes), 0)::int as n from band_results where patch = '2026-01'")).rows[0].n;
  assert.equal(await votes(), 1);
  await as(db, solo, "select delete_my_account()");
  assert.equal(await votes(), 0);
});

test("anonymous voters can delete too", async () => {
  const anon = await newUser(db, { anonymous: true });
  await saveList(db, anon, { patch: PATCH, rank: "gold", placements: { ryu: 1 } });
  await as(db, anon, "select delete_my_account()");
  assert.deepEqual(await traces(anon), NOTHING);
});

test("signed-out visitors can't call it, and it only ever deletes the caller", async () => {
  const [a, b] = await setUpPair("alpha_one", "bravo_two");
  await assert.rejects(as(db, null, "select delete_my_account()"), (e) => e.code === "42501");
  // There's no argument to point it at someone else, and auth.users stays out of reach.
  await assert.rejects(as(db, a, "select delete_my_account($1)", [b.id]), (e) => e.code === "42883");
  await assert.rejects(as(db, a, "delete from auth.users where id = $1", [b.id]), (e) => e.code === "42501");
  await as(db, a, "select delete_my_account()");
  assert.equal((await traces(b)).profiles, 1);
  assert.equal((await traces(b)).lists, 2);
});

test("a session whose account is already gone deletes no one else", async () => {
  const ghost = { id: "00000000-0000-4000-8000-999999999999", anonymous: false };
  // No auth.users row: the call deletes nothing and touches no one else.
  const total = async () => (await db.query("select count(*)::int as n from auth.users")).rows[0].n;
  const n = await total();
  await as(db, ghost, "select delete_my_account()");
  assert.equal(await total(), n);
});
