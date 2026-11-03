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

// Tabs: a game can rate more than its characters (Siege weapons). Each tab is its own category.
import { CATEGORY, listKey, withCategory } from "@/lib/games";

test("every game's first tab is its characters, and other tabs are valid categories with their own items", () => {
  for (const g of GAMES) {
    assert.equal(g.category, CATEGORY);
    assert.equal(g.tabs[0].category, CATEGORY, g.id);
    for (const tab of g.tabs.slice(1)) {
      assert.match(tab.category, /^[a-z]{1,20}$/, `${g.id}: category must pass 008's format check`);
      const shown = withCategory(g, tab.category);
      assert.equal(shown.category, tab.category);
      assert.ok(shown.characters.length >= 5 && shown.characters.length <= 250, `${g.id}/${tab.category} size`);
      const ids = shown.characters.map((c) => c.id);
      assert.equal(new Set(ids).size, ids.length, `${g.id}/${tab.category}: two items share an id`);
      for (const id of ids) assert.match(id, /^[a-z0-9-]{1,40}$/, `${g.id}/${tab.category}: ${id}`);
      for (const role of shown.roles ?? []) for (const id of role.ids) assert.ok(ids.includes(id), `${g.id}/${tab.category}: role lists unknown ${id}`);
      assert.equal(shown.ranks, g.ranks, "a tab keeps the game's rank ladder");
      assert.notEqual(listKey(shown), listKey(g), "drafts for two tabs mustn't overwrite each other");
    }
  }
});

test("withCategory is stable and falls back to the characters tab", () => {
  const siege = GAMES.find((g) => g.id === "siege");
  const other = siege.tabs[1]?.category;
  if (other) assert.equal(withCategory(siege, other), withCategory(siege, other), "same object each time");
  assert.equal(withCategory(siege, "nonsense"), siege);
  assert.equal(withCategory(siege, CATEGORY), siege);
  assert.equal(withCategory(siege, null), siege);
  assert.equal(listKey(siege), "siege", "old drafts and demo lists keep their key");
});
