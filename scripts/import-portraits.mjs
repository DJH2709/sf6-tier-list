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
  // Riot's own pictures, downloaded by scripts/fetch-riot-packs.mjs. Weapons are a tab, so their
  // folder is valorant.weapons (the key CharacterTile looks pictures up by).
  valorant: (dir, id) => `${dir}/valorant/${id}.png`,
  "valorant.weapons": (dir, id) => ({ path: `${dir}/valorant.weapons/${id}.png`, trim: true }),
  lol: (dir, id) => `${dir}/lol/${id}.png`,
  wildrift: (dir, id) => `${dir}/lol/${id}.png`,
  // github.com/Brawlify/CDN, brawlers/borderless/<brawler id>.png: Supercell's brawler head icons.
  // Ids from scripts/brawlstars-ids.json (checked against several fan databases and by eye).
  brawlstars: (dir, id) => (BRAWLSTARS_IDS[id] ? `${dir}/brawlers/borderless/${BRAWLSTARS_IDS[id]}.png` : []),
  // github.com/SiegeEngineers/aoe2techtree, img/Civs/: the game's civilization emblems.
  // Lạc Việt is a Return of Rome civ, kept under ror/.
  aoe2: (dir, id) => [`${dir}/img/Civs/${id}.png`, `${dir}/ror/img/Civs/${id.replace(/-/g, " ")}.png`],
  // github.com/aoe4world/explorer, assets/flags/<civ slug>.png: the game's civilization flags.
  aoe4: (dir, id) => `${dir}/assets/flags/${AOE4_SLUGS[id] ?? id}.png`,
};

const BRAWLSTARS_IDS = JSON.parse(readFileSync(new URL("./brawlstars-ids.json", import.meta.url), "utf8"));
// AoE IV civ name -> aoe4world flag file, where they differ.
const AOE4_SLUGS = {
  "abbasid-dynasty": "abbasid", "delhi-sultanate": "delhi", "holy-roman-empire": "hre", "house-of-lancaster": "lancaster",
  "jeanne-d-arc": "jeannedarc", "jin-dynasty": "jindynasty", "knights-templar": "templar", "macedonian-dynasty": "macedonian",
  "order-of-the-dragon": "orderofthedragon", "sengoku-daimyo": "sengoku", "tughlaq-dynasty": "tughlaq", "zhu-xi-s-legacy": "zhuxi",
  "golden-horde": "goldenhorde",
};

// TournamentStreamHelper (github.com/joaorb64/StreamHelperAssets) game codes, for its
// games/<code>/base_files/icon/ packs. Its config.json maps official names to file codenames.
const TSH = { tekken8: "tekken8", mk1: "mk1", smash: "ssbu", brawlhalla: "bh", rivals2: "roa2", cotw: "ffcotw", invincible: "invs" };
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
// "valorant.weapons" is the weapons tab of Valorant.
const [gameId, tab] = game.split(".");
const entry = data.games.find((g) => g.id === gameId);
const roster = tab ? entry.tabs[tab].characters : entry.characters;
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
