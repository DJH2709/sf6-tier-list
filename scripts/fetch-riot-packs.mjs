// Downloads Riot's own pictures into a pack folder for scripts/import-portraits.mjs:
//   <dir>/valorant/<id>.png          agent icons (valorant-api.com, Riot's game files)
//   <dir>/valorant.weapons/<id>.png  weapon pictures (same source)
//   <dir>/lol/<id>.png               champion squares from Data Dragon (Riot's official CDN)
// Wild Rift has no CDN of its own, so it uses the League squares (same champions, same owner).
//
//   node scripts/fetch-riot-packs.mjs /some/dir
//   node scripts/import-portraits.mjs valorant /some/dir   (and valorant.weapons, lol, wildrift)
//
// Allowed under Riot's "Legal Jibber Jabber" fan policy for free, non-commercial projects; the
// footer carries Riot's disclaimer. See public/characters/README.md.
import { mkdirSync, writeFileSync } from "node:fs";

const slug = (name) =>
  name.replace(/ø/gi, "o").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const json = async (url) => (await fetch(url)).json();
async function save(dir, name, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  writeFileSync(`${dir}/${slug(name)}.png`, Buffer.from(await res.arrayBuffer()));
}

const dir = process.argv[2];
if (!dir) throw new Error("usage: node scripts/fetch-riot-packs.mjs <dir>");
for (const d of ["valorant", "valorant.weapons", "lol"]) mkdirSync(`${dir}/${d}`, { recursive: true });

const agents = (await json("https://valorant-api.com/v1/agents?isPlayableCharacter=true")).data;
for (const a of agents) await save(`${dir}/valorant`, a.displayName, a.displayIcon);
const weapons = (await json("https://valorant-api.com/v1/weapons")).data;
for (const w of weapons) if (w.displayIcon) await save(`${dir}/valorant.weapons`, w.displayName, w.displayIcon);

const [version] = await json("https://ddragon.leagueoflegends.com/api/versions.json");
const champs = Object.values((await json(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`)).data);
for (const c of champs) await save(`${dir}/lol`, c.name, `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`);
console.log(`valorant ${agents.length} agents, ${weapons.length} weapons; League ${champs.length} champions (Data Dragon ${version})`);
