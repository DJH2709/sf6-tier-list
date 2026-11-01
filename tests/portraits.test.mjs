// Checks the character pictures in public/characters. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";

const { games } = JSON.parse(readFileSync("src/lib/games.json", "utf8"));
const slug = (name) =>
  name.replace(/ø/gi, "o").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const dirs = readdirSync("public/characters", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

test("every picture folder is a game", () => {
  for (const d of dirs) assert.ok(games.some((g) => g.id === d), `public/characters/${d} is not a game id`);
});

// Only publishers whose terms allow it (see public/characters/README.md). A new folder means a
// new permission check first.
test("pictures only for games cleared to use them", () => {
  assert.deepEqual(dirs.sort(), ["clashroyale", "overwatch", "siege"]);
});

for (const d of dirs) {
  const game = games.find((g) => g.id === d);
  const ids = new Set(game.characters.map(slug));
  const files = readdirSync(`public/characters/${d}`);

  test(`${d}: every picture belongs to a character on the roster`, () => {
    for (const f of files) assert.ok(ids.has(f.replace(/\.[^.]+$/, "")), `${d}/${f} matches no character`);
  });

  test(`${d}: pictures are small`, () => {
    for (const f of files) assert.ok(statSync(`public/characters/${d}/${f}`).size < 20_000, `${d}/${f} is over 20 KB`);
  });

  // Supercell asks for its disclaimer; Blizzard and Ubisoft for their copyright notice.
  test(`${d}: footer credits the owner`, () => {
    assert.ok(game.disclaimer, `${d} shows pictures but has no disclaimer`);
  });
}

test("portraits.json lists every picture", () => {
  const listed = JSON.parse(readFileSync("src/lib/portraits.json", "utf8"));
  const onDisk = dirs.flatMap((d) => readdirSync(`public/characters/${d}`).map((f) => `${d}/${f.replace(/\.[^.]+$/, "")}`));
  assert.deepEqual(Object.keys(listed).sort(), onDisk.sort());
});
