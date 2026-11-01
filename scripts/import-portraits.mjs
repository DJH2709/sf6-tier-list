// Copies character pictures from a fan asset pack into public/characters/<game>/<id>.webp,
// resized small so the whole roster stays light. Run it again when a roster or pack changes:
//
//   npm i --no-save sharp
//   git clone --depth 1 <pack repo> /some/dir
//   node scripts/import-portraits.mjs <game> /some/dir
//
// The fighting games come from TournamentStreamHelper's asset packs. That repo is big, so fetch
// only the icon folders:
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/joaorb64/StreamHelperAssets /some/dir
//   git -C /some/dir sparse-checkout set --no-cone /games/tekken8/base_files/   (one per game, see TSH below)
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
  // github.com/outlierSlug/immaculate-grid-engine, frontend/public/clashroyale/icons/: Supercell's
  // own card icons from its API asset CDN, with the evo and hero frames, kept current with new
  // cards. Only the transparent margin is trimmed; the card art itself is untouched.
  clashroyale: (dir, id) => ({
    path: `${dir}/frontend/public/clashroyale/icons/${id.replace("p-e-k-k-a", "pekka")}.png`,
    trim: true,
  }),
  // github.com/drippinghere/overwatch-hero-icons, 2d/ (256x256 hero icons).
  overwatch: (dir, id) => [`${dir}/2d/${id}.png`, `${dir}/2d/${id.replace(/-/g, "")}.png`],
  // github.com/zerobertoo/r6operators, operators/<name>/<name>.svg (hand-redrawn badges).
  siege: (dir, id) => {
    const name = id.replace(/-/g, "");
    return [`${dir}/operators/${name}/${name}.svg`, `${dir}/operators/${id.replace(/-/g, "_")}/${id.replace(/-/g, "_")}.svg`];
  },
  // github.com/gfhnpkv/brawlhalla-stance-tracker, portraits/mini/ (legend portraits named like our
  // ids). Has every legend, where TournamentStreamHelper's pack lacked the newest ten.
  brawlhalla: (dir, id) => `${dir}/portraits/mini/${id}.png`,
};

// TournamentStreamHelper (github.com/joaorb64/StreamHelperAssets) game codes, for its
// games/<code>/base_files/icon/ packs. Its config.json maps official names to file codenames.
const TSH = { tekken8: "tekken8", mk1: "mk1", smash: "ssbu", rivals2: "roa2", cotw: "ffcotw", invincible: "invs" };
// Our name -> TSH's name where the two differ.
const TSH_ALIASES = {
  "Manjiro Sano": "Mikey", "Ken Ryuguji": "Draken",
  "Allen the Alien": "Allen", "Cecil Stedman": "Cecil", "The Immortal": "Immortal",
};
// Capcom's guidelines don't allow its art as-is, so its guest characters get no picture in any
// game (Smash's Ryu, Ken and Mega Man; Fatal Fury's Ken and Chun-Li).
const CAPCOM = { smash: ["Ryu", "Ken", "Mega Man"], cotw: ["Ken", "Chun-Li"] };

function tshPack(game, dir) {
  const base = `${dir}/games/${TSH[game]}/base_files`;
  const config = JSON.parse(readFileSync(`${base}/config.json`, "utf8"));
  const iconConfig = existsSync(`${base}/icon/config.json`) ? JSON.parse(readFileSync(`${base}/icon/config.json`, "utf8")) : {};
  const prefix = iconConfig.prefix ?? "";
  const postfix = iconConfig.postfix ?? "_";
  const codenames = {};
  for (const [name, c] of Object.entries(config.character_to_codename)) {
    for (const n of [name, c.smashgg_name, c.codename]) if (n && !(slug(n) in codenames)) codenames[slug(n)] = c.codename;
  }
  const names = Object.fromEntries(JSON.parse(readFileSync("src/lib/games.json", "utf8")).games.find((g) => g.id === game).characters.map((n) => [slug(n), n]));
  return (_, id) => {
    const name = names[id];
    if (CAPCOM[game]?.includes(name)) return [];
    const code = codenames[slug(TSH_ALIASES[name] ?? name)];
    if (!code) return [];
    // MK1's icons are tiny full-body figures, so use its portrait pack, cut to a square around
    // the eyes (the pack records where they are).
    if (game === "mk1") {
      const eye = mk1Eyes(dir)[code]?.["0"];
      return [{ path: `${dir}/games/mk1/portrait/file_${code}_0.png`, eye }];
    }
    // Skin 0 is the default look. Smash numbers its skins with two digits. Fatal Fury's icons are
    // tall strips with the face at the top, so they're cut square from the top.
    const crop = game === "cotw" ? "top" : undefined;
    return [`${prefix}${code}${postfix}0.png`, `${prefix}${code}${postfix}00.png`].map((f) => ({ path: `${base}/icon/${f}`, crop }));
  };
}

let eyes;
const mk1Eyes = (dir) => (eyes ??= JSON.parse(readFileSync(`${dir}/games/mk1/portrait/config.json`, "utf8")).eyesights ?? {});

// A square around the eyes, about the head and shoulders, kept inside the image.
async function aroundEyes(path, eye) {
  const { width, height } = await sharp(path).metadata();
  const side = Math.round(Math.min(width, height) * 0.6);
  const left = Math.max(0, Math.min(width - side, Math.round(eye.x - side / 2)));
  const top = Math.max(0, Math.min(height - side, Math.round(eye.y - side * 0.4)));
  return sharp(path).extract({ left, top, width: side, height: side });
}

const [game, dir] = process.argv.slice(2);
if (TSH[game] && dir) PACKS[game] = tshPack(game, dir);
if (!PACKS[game] || !dir) {
  console.error(`usage: node scripts/import-portraits.mjs <${[...Object.keys(PACKS), ...Object.keys(TSH)].join("|")}> <pack dir>`);
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
  const src = [PACKS[game](dir, id)].flat().map((p) => (typeof p === "string" ? { path: p } : p)).find((p) => existsSync(p.path));
  if (!src) {
    missing.push(name);
    continue;
  }
  // 96px covers a 44px tile at 2x. fit "inside" keeps the whole picture and its shape; only packs
  // flagged above are cut square. Supercell's cards are never cut.
  const img = src.eye ? await aroundEyes(src.path, src.eye) : sharp(src.path, { density: 300 });
  if (src.trim) img.trim();
  const resize = src.crop ? { height: 96, width: 96, fit: "cover", position: src.crop } : { height: 96, width: 96, fit: "inside" };
  await img.resize(resize).webp({ quality: 82 }).toFile(`${out}/${id}.webp`);
}
const made = readdirSync(out).length;
console.log(`${game}: ${made}/${roster.length} pictures`);
if (missing.length) console.log(`no picture (initials shown): ${missing.join(", ")}`);
