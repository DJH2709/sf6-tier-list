// Runs the real supabase/*.sql files in PGlite (Postgres compiled to WebAssembly), on top of a
// small stand-in for the parts of Supabase they use: the auth.users table, auth.uid(),
// auth.jwt() and the anon and authenticated roles. Tests then call the database as a given
// player, the way the site does through Supabase.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

// The order Danny runs them in on the live project.
export const MIGRATIONS = [
  "schema.sql",
  ...readdirSync("supabase").filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort(),
];

const SUPABASE_STANDIN = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  grant usage on schema auth, public to anon, authenticated;
  create table auth.users (id uuid primary key, is_anonymous boolean not null default false);
  -- Supabase reads the caller from the request's JWT; here the test sets it per call.
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant execute on function auth.uid(), auth.jwt() to anon, authenticated;
`;

export async function freshDatabase() {
  const db = new PGlite();
  await db.exec(SUPABASE_STANDIN);
  for (const file of MIGRATIONS) {
    try {
      await db.exec(readFileSync(`supabase/${file}`, "utf8"));
    } catch (e) {
      throw new Error(`supabase/${file} failed: ${e.message}`);
    }
  }
  return db;
}

let next = 1;
// A player with an auth.users row, as after Discord/Google sign-in or an anonymous vote.
export async function newUser(db, { anonymous = false } = {}) {
  const id = `00000000-0000-4000-8000-${String(next++).padStart(12, "0")}`;
  await db.query("insert into auth.users (id, is_anonymous) values ($1, $2)", [id, anonymous]);
  return { id, anonymous };
}

// Runs sql as this player (null = signed out), with the same role and claims Supabase gives them.
export async function as(db, user, sql, params = []) {
  return db.transaction(async (tx) => {
    const claims = user ? JSON.stringify({ sub: user.id, is_anonymous: user.anonymous }) : "{}";
    await tx.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)", [
      user?.id ?? "",
      claims,
    ]);
    await tx.exec(`set local role ${user ? "authenticated" : "anon"}`);
    return tx.query(sql, params);
  });
}

// The call submitList() in src/lib/store.ts makes.
// Leave order out to call it the way the site did before 014_order_in_tier.sql.
export function saveList(db, user, { game = "sf6", category = "characters", patch, rank, proofUrl = null, isPublic = true, placements, order }) {
  const args = [game, category, patch, rank, proofUrl, isPublic, JSON.stringify(placements)];
  if (order) args.push(order);
  const slots = args.map((_, i) => `$${i + 1}`).join(", ");
  return as(db, user, `select save_list(${slots}) as updated`, args).then((r) => r.rows[0].updated);
}
