// A stand-in for Supabase's HTTP API in front of PGlite, so the site's own src/lib code can be
// tested through the real supabase-js client. It covers only the calls the site makes:
// anonymous sign-up, sign-out, rpc calls, and table reads with eq/in/ilike filters, an order and one
// level of embedding (tier_lists -> tier_placements). Requests run as the player in the bearer
// token with the same role Supabase would use, so grants and row policies apply.
import { as, newUser } from "./supabase.mjs";

export const FAKE_URL = "http://supabase.test";
export const FAKE_KEY = "test-publishable-key";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const fromB64 = (s) => JSON.parse(Buffer.from(s, "base64url").toString());

function session(user) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: user.id, is_anonymous: user.anonymous, role: "authenticated", exp: now + 3600 };
  return {
    access_token: `${b64({ alg: "none" })}.${b64(claims)}.x`,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: `refresh-${user.id}`,
    user: { id: user.id, aud: "authenticated", role: "authenticated", is_anonymous: user.anonymous, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
  };
}

function caller(headers) {
  const token = new Headers(headers).get("authorization")?.replace(/^Bearer /, "");
  if (!token || token === FAKE_KEY) return null;
  const claims = fromB64(token.split(".")[1]);
  return { id: claims.sub, anonymous: claims.is_anonymous };
}

const ident = (name) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`fake Supabase: unexpected name ${name}`);
  return `"${name}"`;
};

// "id, patch, tier_placements(item_id, score)" -> SQL select list for table t.
function selectList(table, select) {
  const parts = select.match(/[a-z_]+\([^)]*\)|[a-z_*]+/g);
  return parts.map((p) => {
    const embed = p.match(/^([a-z_]+)\(([^)]*)\)$/);
    if (!embed) return p === "*" ? "t.*" : `t.${ident(p)}`;
    const [, child, cols] = embed;
    if (table !== "tier_lists" || child !== "tier_placements") throw new Error(`fake Supabase: can't embed ${child} in ${table}`);
    const fields = cols.split(",").map((c) => c.trim());
    return `coalesce((select json_agg(json_build_object(${fields.map((f) => `'${f}', c.${ident(f)}`).join(", ")}))
      from tier_placements c where c.list_id = t.id), '[]') as tier_placements`;
  }).join(", ");
}

function reply(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function pgError(e) {
  const status = e.code === "42501" ? 403 : e.code === "42883" ? 404 : 400;
  // PostgREST answers an unknown function with its own code.
  const code = e.code === "42883" ? "PGRST202" : e.code;
  return reply(status, { code, message: e.message, details: null, hint: null });
}

export function fakeSupabase(db) {
  const calls = [];
  async function fetch(input, init = {}) {
    const url = new URL(typeof input === "string" ? input : input.url);
    const method = (init.method ?? "GET").toUpperCase();
    const body = init.body ? JSON.parse(init.body) : undefined;
    const user = caller(init.headers);
    calls.push({ method, path: url.pathname, search: url.search, body, user: user?.id ?? null });
    try {
      if (url.pathname === "/auth/v1/signup") {
        const u = await newUser(db, { anonymous: true });
        return reply(200, session(u));
      }
      if (url.pathname === "/auth/v1/logout") return reply(204);
      const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/([a-z_]+)$/);
      if (rpc) {
        const args = Object.entries(body ?? {});
        const sql = `select ${ident(rpc[1])}(${args.map(([k], i) => `${ident(k)} => $${i + 1}`).join(", ")}) as result`;
        // PostgREST turns a JSON array into a Postgres array (text[] etc.) and an object into jsonb.
        const params = args.map(([, v]) => (v !== null && typeof v === "object" && !Array.isArray(v) ? JSON.stringify(v) : v));
        const { rows } = await as(db, user, sql, params);
        return reply(200, rows[0].result ?? null);
      }
      const table = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
      if (table && method === "GET") {
        const where = [];
        const params = [];
        let order = "";
        for (const [k, v] of url.searchParams) {
          if (k === "select") continue;
          if (k === "order") {
            const [col, dir] = v.split(".");
            order = ` order by t.${ident(col)} ${dir === "desc" ? "desc" : "asc"}`;
          } else if (v.startsWith("eq.")) {
            params.push(v.slice(3));
            where.push(`t.${ident(k)}::text = $${params.length}`);
          } else if (v.startsWith("ilike.")) {
            // PostgREST lets * stand for %.
            params.push(v.slice(6).replace(/\*/g, "%"));
            where.push(`t.${ident(k)}::text ilike $${params.length}`);
          } else if (v.startsWith("in.(")) {
            params.push(v.slice(4, -1).split(",").map((s) => s.replace(/^"|"$/g, "")));
            where.push(`t.${ident(k)}::text = any($${params.length})`);
          } else throw new Error(`fake Supabase: unsupported filter ${k}=${v}`);
        }
        const sql = `select ${selectList(table[1], url.searchParams.get("select") ?? "*")} from ${ident(table[1])} t` +
          (where.length ? ` where ${where.join(" and ")}` : "") + order;
        const { rows } = await as(db, user, sql, params);
        return reply(200, rows);
      }
      throw new Error(`fake Supabase: no route for ${method} ${url.pathname}`);
    } catch (e) {
      if (e.code) return pgError(e);
      throw e;
    }
  }
  return { fetch, calls };
}
