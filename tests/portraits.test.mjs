// Checks the character pictures in public/characters. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";

const { games } = JSON.parse(readFileSync("src/lib/games.json", "utf8"));
const slug = (name) =>
  name.replace(/ø/gi, "o").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// A tab's pictures live in <game>.<tab>, e.g. valorant.weapons.
const rosterOf = (dir) => {
  const [id, tab] = dir.split(".");
  const game = games.find((g) => g.id === id);
  return game && (tab ? game.tabs?.[tab] && { ...game, characters: game.tabs[tab].characters } : game);
};
const dirs = readdirSync("public/characters", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

test("every picture folder is a game", () => {
  for (const d of dirs) assert.ok(rosterOf(d), `public/characters/${d} is not a game id or game.tab`);
});

// Never for publishers whose rules forbid using their art as-is (see public/characters/README.md):
// Capcom (SF6), Arc System Works (Strive), Cygames (GBVSR). A new game's folder needs a permission
// check first, so the full list is pinned too.
test("pictures only for games whose publishers don't forbid it", () => {
  for (const banned of ["sf6", "ggst", "gbvsr"]) assert.ok(!dirs.includes(banned), `${banned} must not have pictures`);
  assert.deepEqual(dirs.sort(), [
    "aoe2", "aoe4", "brawlhalla", "brawlstars", "clashroyale", "cotw", "invincible", "lol", "mk1", "overwatch", "rivals2", "siege",
    "smash", "tekken8", "valorant", "valorant.weapons", "wildrift",
  ]);
});

test("Capcom guest characters have no picture in other games", () => {
  const capcom = { smash: ["ryu", "ken", "mega-man"], cotw: ["ken", "chun-li"] };
  for (const [game, ids] of Object.entries(capcom)) {
    const files = readdirSync(`public/characters/${game}`).map((f) => f.replace(/\.[^.]+$/, ""));
    for (const id of ids) assert.ok(!files.includes(id), `${game}/${id} is Capcom art`);
  }
});

for (const d of dirs) {
  const game = rosterOf(d);
  const ids = new Set(game.characters.map(slug));
  const files = readdirSync(`public/characters/${d}`);

  test(`${d}: every picture belongs to a character on the roster`, () => {
    for (const f of files) assert.ok(ids.has(f.replace(/\.[^.]+$/, "")), `${d}/${f} matches no character`);
  });

  test(`${d}: pictures are small`, () => {
    for (const f of files) assert.ok(statSync(`public/characters/${d}/${f}`).size < 20_000, `${d}/${f} is over 20 KB`);
  });

  // Supercell asks for its disclaimer; the others get a copyright notice.
  test(`${d}: footer credits the owner`, () => {
    assert.ok(game.disclaimer, `${d} shows pictures but has no disclaimer`);
  });
}

test("portraits.json lists every picture", () => {
  const listed = JSON.parse(readFileSync("src/lib/portraits.json", "utf8"));
  const onDisk = dirs.flatMap((d) => readdirSync(`public/characters/${d}`).map((f) => `${d}/${f.replace(/\.[^.]+$/, "")}`));
  assert.deepEqual(Object.keys(listed).sort(), onDisk.sort());
});
