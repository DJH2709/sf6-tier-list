// Lists which character portraits exist in public/characters/<game id>/, so tiles know
// whether to show a picture or fall back to initials without a 404 per character.
// Runs before build and dev. Drop in <character id>.png, .jpg or .webp.
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";

mkdirSync("public/characters", { recursive: true });
const portraits = {};
for (const dir of readdirSync("public/characters", { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  for (const f of readdirSync(`public/characters/${dir.name}`)) {
    if (/\.(png|jpe?g|webp)$/i.test(f)) portraits[`${dir.name}/${f.replace(/\.[^.]+$/, "")}`] = `/characters/${dir.name}/${f}`;
  }
}
writeFileSync("src/lib/portraits.json", JSON.stringify(portraits, null, 2) + "\n");
console.log(`portraits: ${Object.keys(portraits).length} found`);
