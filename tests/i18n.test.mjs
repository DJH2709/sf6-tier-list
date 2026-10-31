// Checks every language file against English. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const DIR = "src/locales/";
// "key": "text" pairs, one per line, as the locale files are written.
function strings(file) {
  const text = readFileSync(DIR + file, "utf8");
  return Object.fromEntries([...text.matchAll(/^\s*"([\w.]+)":\s*"((?:[^"\\]|\\.)*)",?\s*$/gm)].map((m) => [m[1], m[2]]));
}
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

const english = strings("en.ts");
const languages = readdirSync(DIR).filter((f) => f.endsWith(".ts") && !["en.ts", "characters.ts"].includes(f));

test("there are translations to check", () => {
  assert.ok(Object.keys(english).length > 100);
  assert.ok(languages.includes("es.ts"));
});

for (const file of languages) {
  const messages = strings(file);

  test(`${file}: every key exists in English`, () => {
    assert.deepEqual(Object.keys(messages).filter((k) => !(k in english)), []);
  });

  test(`${file}: no English string is missing`, () => {
    assert.deepEqual(Object.keys(english).filter((k) => !(k in messages)), []);
  });

  // A dropped or misspelt {name} shows up on the page as a raw placeholder or a missing number.
  test(`${file}: placeholders match English`, () => {
    const wrong = Object.entries(messages)
      .filter(([k, v]) => k in english && english[k] && placeholders(v).join() !== placeholders(english[k]).join())
      .map(([k]) => k);
    assert.deepEqual(wrong, []);
  });

  test(`${file}: language is registered in the switcher`, () => {
    const config = readFileSync("src/lib/i18n/config.ts", "utf8");
    assert.match(config, new RegExp(`"${file.replace(".ts", "")}"`));
  });
}
