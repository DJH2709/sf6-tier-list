// Launch check 4.4: every production response carries the security headers, and nothing
// advertises the framework. Imports the real next.config.ts.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "production";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
delete process.env.VERCEL_ENV;
const { default: config } = await import("../next.config.ts");

test("security headers are sent on every route in production", async () => {
  const rules = await config.headers();
  assert.equal(rules.length, 1);
  assert.equal(rules[0].source, "/(.*)");
  const headers = Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]));
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(headers["Strict-Transport-Security"], /max-age=\d{7,}/);
  assert.match(headers["Permissions-Policy"], /camera=\(\)/);
  const csp = headers["Content-Security-Policy"];
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /connect-src 'self' https:\/\/abc\.supabase\.co wss:\/\/abc\.supabase\.co/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.doesNotMatch(csp, /vercel\.live/, "preview-only hosts must not be allowed in production");
});

test("the framework is not advertised", () => {
  assert.equal(config.poweredByHeader, false);
});
