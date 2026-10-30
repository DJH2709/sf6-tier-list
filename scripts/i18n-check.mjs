// Lists UI strings that exist in English but not yet in another language.
// Those still work (they show in English), so this only reports and never fails a build.
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../src/locales/", import.meta.url);
const keysIn = (file) => new Set([...readFileSync(new URL(file, dir), "utf8").matchAll(/^\s*"([\w.]+)":/gm)].map((m) => m[1]));
const english = keysIn("en.ts");

for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts") && !["en.ts", "characters.ts"].includes(f))) {
  const have = keysIn(file);
  const missing = [...english].filter((k) => !have.has(k));
  const extra = [...have].filter((k) => !english.has(k));
  console.log(`${file}: ${missing.length ? `${missing.length} missing` : "complete"}`);
  for (const k of missing) console.log(`  missing ${k}`);
  for (const k of extra) console.log(`  unused  ${k}`);
}
