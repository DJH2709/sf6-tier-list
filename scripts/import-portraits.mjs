// Copies character pictures from a fan asset pack into public/characters/<game>/<id>.webp,
// resized small so the whole roster stays light. Run it again when a roster or pack changes:
//
//   npm i --no-save sharp
//   git clone --depth 1 <pack repo> /some/dir
//   node scripts/import-portraits.mjs <game> /some/dir
//
// Packs used, and why each is allowed, are in public/characters/README.md. Pictures are only
// resized and re-encoded, never cropped or edited (Supercell's policy forbids modifying assets).
import { readFileSync, readdirSync, existsSync, mkdirSync, rmSync } from "node:fs";
import sharp from "sharp";

// Keep in step with slug() in src/lib/games.ts.
const slug = (name) =>
  name.replace(/ø/gi, "o").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Where each pack keeps a character's file, from our character id.
const PACKS = {
  // github.com/RoyaleAPI/cr-api-assets, cards-150/ (150x180 card art).
  clashroyale: (dir, id) =>
    `${dir}/cards-150/${id.replace("p-e-k-k-a", "pekka").replace(/-evo$/, "-ev1").replace(/-hero$/, "-hero-ev1")}.png`,
  // github.com/drippinghere/overwatch-hero-icons, 2d/ (256x256 hero icons).
  overwatch: (dir, id) => [`${dir}/2d/${id}.png`, `${dir}/2d/${id.replace(/-/g, "")}.png`],
  // github.com/zerobertoo/r6operators, operators/<name>/<name>.svg (hand-redrawn badges).
  siege: (dir, id) => {
    const name = id.replace(/-/g, "");
    return [`${dir}/operators/${name}/${name}.svg`, `${dir}/operators/${id.replace(/-/g, "_")}/${id.replace(/-/g, "_")}.svg`];
  },
};

const [game, dir] = process.argv.slice(2);
if (!PACKS[game] || !dir) {
  console.error(`usage: node scripts/import-portraits.mjs <${Object.keys(PACKS).join("|")}> <pack dir>`);
  process.exit(1);
}

const data = JSON.parse(readFileSync("src/lib/games.json", "utf8"));
const roster = data.games.find((g) => g.id === game).characters;
const out = `public/characters/${game}`;
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const missing = [];
for (const name of roster) {
  const id = slug(name);
  const src = [PACKS[game](dir, id)].flat().find((p) => existsSync(p));
  if (!src) {
    missing.push(name);
    continue;
  }
  // 96px tall covers a 48px tile at 2x. fit "inside" keeps the whole picture and its shape.
  await sharp(src, { density: 300 }).resize({ height: 96, width: 96, fit: "inside" }).webp({ quality: 82 }).toFile(`${out}/${id}.webp`);
}
const made = readdirSync(out).length;
console.log(`${game}: ${made}/${roster.length} pictures`);
if (missing.length) console.log(`no picture (initials shown): ${missing.join(", ")}`);
