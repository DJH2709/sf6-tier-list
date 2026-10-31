// Launch check 5.1/5.2: raw error text from the database or the browser must never reach the
// screen. Only messages that are translation keys are shown; everything else becomes a
// friendly fallback and goes to the console.
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { errorText, translator, localeFromHeader } from "@/lib/i18n/config";
import en from "@/locales/en";

const t = translator("en");

test("a key thrown by library code is translated", () => {
  assert.equal(errorText(new Error("error.usernameTaken"), t), en["error.usernameTaken"]);
  assert.equal(errorText(new Error("error.dbBehind"), t), en["error.dbBehind"]);
  assert.equal(errorText("error.unreachable", t), en["error.unreachable"]);
});

test("database and runtime error text is hidden behind the fallback", () => {
  const log = mock.method(console, "error", () => {});
  try {
    const leaks = [
      new Error('new row for relation "tier_lists" violates check constraint "tier_lists_patch_format"'),
      new Error("permission denied for table tier_lists"),
      new TypeError("Cannot read properties of undefined (reading '0')"),
      new Error("Couldn't reach Supabase at https://rcffniccbhapmzqezsgb.supabase.co"),
      { message: "permission denied for function save_list", code: "42501" },
    ];
    for (const e of leaks) {
      const shown = errorText(e, t);
      assert.equal(shown, en["make.error"], String(e));
      assert.doesNotMatch(shown, /tier_lists|supabase|undefined|permission/i);
    }
    assert.equal(errorText(new Error("boom"), t, "account.saveFailed"), en["account.saveFailed"]);
    assert.ok(log.mock.callCount() >= leaks.length, "the real error is still logged for whoever runs the site");
  } finally {
    log.mock.restore();
  }
});

test("missing or empty errors still give a sentence", () => {
  assert.equal(errorText(undefined, t), en["make.error"]);
  assert.equal(errorText("", t), en["make.error"]);
});

test("user-facing strings never tell a visitor to run SQL or change Vercel", () => {
  for (const [key, value] of Object.entries(en)) {
    if (key.startsWith("setup.")) continue; // shown only on a deployment with no database settings, i.e. to its owner
    assert.doesNotMatch(value, /\.sql|SQL editor|Vercel|Supabase/, `${key} leaks setup detail`);
  }
});

test("language is picked from Accept-Language, with traditional Chinese falling back to English", () => {
  assert.equal(localeFromHeader("ja,en;q=0.8"), "ja");
  assert.equal(localeFromHeader("ko-KR"), "ko");
  assert.equal(localeFromHeader("zh-CN"), "zh");
  assert.equal(localeFromHeader("zh-TW,en"), "en");
  assert.equal(localeFromHeader(null), "en");
  assert.equal(localeFromHeader("fr"), "en");
});
