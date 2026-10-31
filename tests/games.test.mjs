// Checks the game data the site and database both depend on. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SQL_FILE, withRanks } from "../scripts/ranks-sql.mjs";

const { games } = JSON.parse(readFileSync("src/lib/games.json", "utf8"));
const BANDS = ["beginner", "intermediate", "advanced", "elite"];
const slug = (name) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

test("ten games, SF6 first, ids usable in a URL", () => {
  assert.equal(games.length, 10);
  assert.equal(games[0].id, "sf6");
  assert.equal(new Set(games.map((g) => g.id)).size, games.length);
  for (const g of games) assert.match(g.id, /^[a-z0-9]+$/, g.id);
});

for (const g of games) {
  test(`${g.id}: roster`, () => {
    assert.ok(g.characters.length >= 10, "roster looks too short");
    const ids = g.characters.map(slug);
    assert.ok(ids.every(Boolean), "a name slugs to nothing");
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(dupes, [], "two characters share an id");
  });

  test(`${g.id}: rank ladder`, () => {
    const ids = g.ranks.map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate rank id");
    for (const id of ids) assert.match(id, /^[a-z0-9_]+$/, id);
    // Lowest rank first, bands never go back down, and every band has a rank.
    const order = g.ranks.map((r) => BANDS.indexOf(r.band));
    assert.ok(order.every((b) => b >= 0), "unknown band");
    assert.deepEqual(order, [...order].sort((a, b) => a - b), "bands out of order");
    assert.deepEqual([...new Set(order)], [0, 1, 2, 3], "a band has no ranks");
    // Elite means proven, and only elite ranks need proof (unproven ones drop to Advanced).
    for (const r of g.ranks) assert.equal(!!r.needsProof, r.band === "elite", r.id);
  });
}

test("SF6 rank ids unchanged, so existing lists keep their band", () => {
  assert.deepEqual(games[0].ranks.map((r) => r.id), [
    "rookie", "iron", "bronze", "silver", "gold", "platinum", "diamond", "master", "high_master",
    "grand_master", "ultimate_master", "legend",
  ]);
});

test("SF6 character ids unchanged, so existing placements still match", () => {
  const ids = games[0].characters.map(slug);
  for (const id of ["ryu", "chun-li", "e-honda", "a-k-i", "m-bison", "c-viper", "dee-jay"]) assert.ok(ids.includes(id), id);
});

test(`${SQL_FILE} has the same ladders as games.json (run npm run ranks-sql)`, () => {
  const sql = readFileSync(SQL_FILE, "utf8");
  assert.equal(sql, withRanks(sql));
  assert.match(sql, /-- ranks:start\ninsert into game_ranks/);
});
