// Lists which character portraits exist in public/characters, so tiles know
// whether to show a picture or fall back to initials without a 404 per character.
// Runs before build and dev. Drop in <character id>.png, .jpg or .webp.
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";

mkdirSync("public/characters", { recursive: true });
const files = readdirSync("public/characters").filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
const portraits = Object.fromEntries(files.map((f) => [f.replace(/\.[^.]+$/, ""), `/characters/${f}`]));
writeFileSync("src/lib/portraits.json", JSON.stringify(portraits, null, 2) + "\n");
console.log(`portraits: ${files.length} found`);
