// Usernames (supabase/009_username_capitals.sql, src/lib/account.ts, src/lib/profiles.ts):
// capitals allowed, symbols not, and no two names that differ only in case.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { freshDatabase, newUser, as } from "./db/supabase.mjs";
import { fakeSupabase, FAKE_KEY, FAKE_URL } from "./db/fake-supabase.mjs";

let db, fake, account, profiles;
before(async () => {
  db = await freshDatabase();
  fake = fakeSupabase(db);
  globalThis.fetch = fake.fetch;
  process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = FAKE_KEY;
  account = await import("@/lib/account");
  profiles = await import("@/lib/profiles");
});

async function claim(name) {
  const u = await newUser(db);
  await as(db, u, "insert into profiles (username) values ($1)", [name]);
  return u;
}

const SYMBOLS = ["danny h", "danny-h", "danny.h", "danny!", "@danny", "dånny", "dan#y", "danny😀", "dan%y", "ab", "a".repeat(21)];

test("the database accepts capital letters", async () => {
  await claim("DannyH");
  const { rows } = await db.query("select username from profiles where username = 'DannyH'");
  assert.equal(rows.length, 1, "kept as typed, not lowercased");
});

test("the database refuses symbols, spaces, accents and the wrong length", async () => {
  for (const name of SYMBOLS) {
    await assert.rejects(claim(name), (e) => e.code === "23514", `${name} should be refused`);
  }
});

test("two usernames that differ only in case can't both exist", async () => {
  await claim("CaseTest");
  for (const name of ["casetest", "CASETEST", "cAsEtEsT"]) {
    await assert.rejects(claim(name), (e) => e.code === "23505", `${name} clashes with CaseTest`);
  }
});

test("profile links find the player whatever the case", async () => {
  for (const typed of ["DannyH", "dannyh", "DANNYH"]) {
    const p = await profiles.getProfileByUsername(typed);
    assert.equal(p?.username, "DannyH", `/u/${typed}`);
  }
});

test("an underscore in a link matches only an underscore, and symbols find nobody", async () => {
  await claim("Big_Al");
  assert.equal((await profiles.getProfileByUsername("big_al"))?.username, "Big_Al");
  assert.equal(await profiles.getProfileByUsername("bigXal"), null, "_ is not a wildcard");
  for (const typed of ["Big%", "B*", "dan%y", "big al", ""]) {
    assert.equal(await profiles.getProfileByUsername(typed), null, typed);
  }
});

test("the form refuses symbols with the plain message before sending anything", async () => {
  for (const name of SYMBOLS) {
    const before = fake.calls.length;
    await assert.rejects(account.createProfile(name, "", null), { message: "error.usernameFormat" }, name);
    assert.equal(fake.calls.length, before, `${name}: nothing sent`);
  }
});

test("the suggested username keeps capitals and drops symbols", () => {
  const session = (meta) => ({ user: { user_metadata: meta } });
  assert.equal(account.suggestUsername(session({ preferred_username: "Danny.Harrison-03!" })), "DannyHarrison03");
  assert.equal(account.suggestUsername(session({ full_name: "Big Al" })), "BigAl");
  assert.match(account.suggestUsername(session({ name: "x".repeat(30) })), /^x{20}$/);
});
