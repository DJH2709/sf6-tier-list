// The community results split by rank band: the band_results view from the real SQL files,
// and demo mode's tallyBands() in src/lib/store.ts, which must agree with it.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { freshDatabase, newUser, saveList, as } from "./db/supabase.mjs";
import { tallyBands } from "@/lib/store";
import { GAMES } from "@/lib/games";

const sf6 = GAMES.find((g) => g.id === "sf6");
const PATCH = sf6.patch;
const PROOF = "https://www.streetfighter.com/6/buckler/profile/1";
let db;
before(async () => {
  db = await freshDatabase();
});

// band_results for SF6 this patch, as a visitor sees it, keyed "band:item".
async function results(patch = PATCH, game = "sf6") {
  const { rows } = await as(
    db, null,
    "select band, item_id, avg_score, votes, lists from band_results where game = $1 and category = 'characters' and patch = $2",
    [game, patch],
  );
  return Object.fromEntries(rows.map((r) => [`${r.band}:${r.item_id}`, r]));
}

async function vote(rank, placements, extra = {}) {
  const u = await newUser(db);
  await saveList(db, u, { patch: PATCH, rank, placements, ...extra });
  return u;
}

test("each band averages its own lists", async () => {
  await vote("diamond", { ryu: 5, luke: 2 });
  await vote("platinum", { ryu: 3, luke: 4 });
  await vote("iron", { ryu: 1 });
  const r = await results();
  assert.deepEqual(r["intermediate:ryu"], { band: "intermediate", item_id: "ryu", avg_score: 4, votes: 2, lists: 2 });
  assert.deepEqual(r["intermediate:luke"], { band: "intermediate", item_id: "luke", avg_score: 3, votes: 2, lists: 2 });
  assert.deepEqual(r["beginner:ryu"], { band: "beginner", item_id: "ryu", avg_score: 1, votes: 1, lists: 1 });
  assert.equal(r["advanced:ryu"], undefined);
});

test("unproven top-rank lists count in the band below; approved ones count as elite", async () => {
  await vote("legend", { ken: 5 });
  const pending = await vote("grand_master", { ken: 3 }, { proofUrl: PROOF });
  let r = await results();
  assert.equal(r["elite:ken"], undefined, "no elite results before a proof is approved");
  assert.equal(r["advanced:ken"].votes, 2);

  await db.query("update tier_lists set verification = 'approved' where user_id = $1", [pending.id]);
  r = await results();
  assert.deepEqual(r["elite:ken"], { band: "elite", item_id: "ken", avg_score: 3, votes: 1, lists: 1 });
  assert.deepEqual(r["advanced:ken"], { band: "advanced", item_id: "ken", avg_score: 5, votes: 1, lists: 1 });

  await db.query("update tier_lists set verification = 'rejected' where user_id = $1", [pending.id]);
  assert.equal((await results())["elite:ken"], undefined, "a rejected proof drops back to advanced");
});

test("SF6 Diamond counts with Platinum, not with Master; Gold counts with Silver", async () => {
  await vote("diamond", { cammy: 5 });
  await vote("master", { cammy: 1 });
  await vote("high_master", { cammy: 1 });
  await vote("gold", { cammy: 2 });
  const r = await results();
  assert.equal(r["intermediate:cammy"].avg_score, 5);
  assert.equal(r["advanced:cammy"].votes, 2);
  assert.equal(r["advanced:cammy"].avg_score, 1);
  assert.equal(r["beginner:cammy"].avg_score, 2);
});

test("010 moves lists saved under the old SF6 bands", async () => {
  await db.query("update game_ranks set band = 'advanced' where game = 'sf6' and rank_id = 'diamond'");
  await db.query("update game_ranks set band = 'intermediate' where game = 'sf6' and rank_id = 'gold'");
  await vote("diamond", { dhalsim: 4 });
  await vote("gold", { dhalsim: 2 });
  assert.equal((await results())["advanced:dhalsim"].votes, 1, "old ladder: Diamond sits with Master");
  await db.exec(readFileSync("supabase/010_sf6_diamond_band.sql", "utf8"));
  const r = await results();
  assert.equal(r["advanced:dhalsim"], undefined);
  assert.equal(r["intermediate:dhalsim"].avg_score, 4);
  assert.equal(r["beginner:dhalsim"].avg_score, 2);
});

test("an edited list moves its votes instead of counting twice", async () => {
  const u = await vote("silver", { zangief: 1 });
  await saveList(db, u, { patch: PATCH, rank: "master", placements: { zangief: 5 } });
  const r = await results();
  assert.equal(r["beginner:zangief"], undefined);
  assert.equal(r["advanced:zangief"].avg_score, 5);
  assert.equal(r["advanced:zangief"].votes, 1);
});

test("private lists still count, and other patches and games don't", async () => {
  await vote("bronze", { blanka: 4 }, { isPublic: false });
  await vote("bronze", { blanka: 2 }, { patch: "2026-07" });
  await vote("bronze", { blanka: 1 }, { game: "tekken8", rank: GAMES.find((g) => g.id === "tekken8").ranks[0].id });
  const r = await results();
  assert.equal(r["beginner:blanka"].votes, 1);
  assert.equal(r["beginner:blanka"].avg_score, 4);
});

test("visitors can read the results but not the lists behind them", async () => {
  await assert.rejects(as(db, null, "select * from list_bands"), (e) => e.code === "42501");
});

test("demo mode's tallyBands() gives the same numbers as band_results", async () => {
  // Every SF6 rank, a mix of scores, and a list from an older patch that must be left out.
  const lists = sf6.ranks.map((rank, i) => ({
    rank: rank.id,
    placements: Object.fromEntries(sf6.characters.slice(0, 6).map((c, j) => [c.id, ((i + j) % 5) + 1])),
  }));
  lists.push({ patch: "2026-07", rank: "gold", placements: { [sf6.characters[0].id]: 1 } });

  const fresh = await freshDatabase();
  for (const l of lists) {
    const u = await newUser(fresh);
    await saveList(fresh, u, { patch: l.patch ?? PATCH, rank: l.rank, placements: l.placements });
  }
  const { rows } = await fresh.query(
    "select band, item_id, avg_score, votes, lists from band_results where game = 'sf6' and patch = $1",
    [PATCH],
  );
  const key = (r) => `${r.band}:${r.item_id}`;
  const round = (r) => ({ ...r, avg_score: Math.round(r.avg_score * 1e9) / 1e9 });
  const sorted = (rs) => rs.map(round).sort((a, b) => key(a).localeCompare(key(b)));
  assert.ok(rows.length > 0);
  assert.deepEqual(sorted(tallyBands(sf6, lists)), sorted(rows));
});
