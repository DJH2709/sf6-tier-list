// The games page search and genre filter.
import { test } from "node:test";
import assert from "node:assert/strict";
import { findGames, GAMES, GENRES } from "@/lib/games";

const ids = (q, genre = null) => findGames(GAMES, q, genre).map((g) => g.id);

test("every game has at least one known genre", () => {
  for (const g of GAMES) {
    assert.ok(g.genres.length > 0, `${g.id} has no genre`);
    for (const genre of g.genres) assert.ok(GENRES.includes(genre), `${g.id}: unknown genre ${genre}`);
  }
});

test("an empty search lists every game", () => {
  assert.equal(ids("").length, GAMES.length);
  assert.equal(ids("   ").length, GAMES.length);
});

test("search matches names, short names and publishers, ignoring case and punctuation", () => {
  assert.deepEqual(ids("siege"), ["siege"]);
  assert.deepEqual(ids("RAINBOW six"), ["siege"]);
  assert.deepEqual(ids("sf6"), ["sf6"]);
  assert.ok(ids("guilty gear strive").includes("ggst"));
  assert.ok(ids("smash bros").includes("smash"));
  assert.ok(ids("capcom").includes("sf6"));
  assert.deepEqual(ids("street fighter 7"), []);
});

test("words can come in any order and a squashed name still matches", () => {
  assert.deepEqual(ids("siege rainbow"), ["siege"]);
  assert.ok(ids("clashroyale").includes("clashroyale"));
  assert.ok(ids("overwatch").includes("overwatch"));
});

test("genre filter keeps only games with that genre, and combines with search", () => {
  assert.deepEqual(ids("", "platform").sort(), ["brawlhalla", "rivals2", "smash"]);
  assert.deepEqual(ids("", "shooter").sort(), ["overwatch", "siege"]);
  assert.deepEqual(ids("siege", "fighting"), []);
  assert.deepEqual(ids("smash", "fighting"), ["smash"]);
});
