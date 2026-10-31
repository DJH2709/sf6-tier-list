# Launch check - sf6-tier-list

Gated pre-launch checklist. Sections run in order; a section is closed only when every
item is PASS, N/A or WAIVED. Statuses: TODO, PASS, FAIL, N/A, WAIVED, MANUAL (waiting on Danny).
Started 2026-10-30 on main `11cbd3d` (PR #11 merged).

Test setup used for evidence:
- Local Postgres 16 with `supabase/schema.sql`, `002`, `003`, `004` loaded and a stub `auth`
  schema (`auth.uid()` reads `request.jwt.claim.sub`; roles `anon` and `authenticated`).
  Supabase's API (PostgREST) runs queries exactly this way, so this exercises the real policies.
- Production build (`next build` + `next start`) against a fake Supabase REST server on
  localhost, because the sandbox cannot reach *.supabase.co or *.vercel.app.

## Section 1: Secrets and keys  (passed on `e2a4a29`, 2026-10-30)

- [PASS] 1.1 No hard-coded secrets in source. Evidence: `grep -rnE "sk_live|sk_test|sk-ant|service_role|AKIA[0-9A-Z]{12}|-----BEGIN|password=|eyJhbGci"` over *.ts/tsx/js/mjs/json/sql/md (excluding node_modules, .next) returned nothing. The only config read is `process.env.NEXT_PUBLIC_*` in `src/lib/store.ts:17-23` and `src/lib/sf6.ts:59`.
- [PASS] 1.2 Env files ignored and never committed. Evidence: `.gitignore:34-35` has `.env*` with `!.env.example`; `git ls-files | grep -i .env` → only `.env.example`; `git log --all --name-only -- '.env*' '**/.env*' | sort -u` → only `.env.example` (placeholders, no values). gitleaks not installed in the sandbox.
- [PASS] 1.3 Secret keys never reach the client bundle. Evidence: production build with a marker publishable key; `grep -rlE "sk_live|sk_test|sk-ant|service_role|AKIA…|BEGIN (RSA|PRIVATE)|eyJhbGciOi" .next/static` → no matches. The marker publishable key and project URL appear in one chunk (`.next/static/chunks/524-*.js`), which is expected: that key is public by design.
- [N/A] 1.4 Production and development use different keys. The app holds no secret key at all: it only uses the Supabase publishable (anon) key, whose safety rests on RLS (section 2). Evidence: `grep -rniE "service_role|SERVICE_KEY|SUPABASE_SERVICE" src supabase scripts README.md` → none; no non-`NEXT_PUBLIC_` env reads anywhere. Note for Danny: if `.env.local` points at the live project, local test votes land in the live table (hygiene, not security).
- [PASS] 1.5 No high/critical dependency vulnerabilities. Was FAIL: `npm audit --omit=dev` → 1 high (postcss 8.4.31 pinned inside next@15.5.28: GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849) + 1 moderate (next, via that postcss). Fixed in `e2a4a29`: `package.json` `overrides.postcss = ^8.5.32`; `npm ls postcss` now shows 8.5.32 deduped for next too. Re-run: `npm audit --omit=dev` → "found 0 vulnerabilities"; `next build` and `eslint` pass.

## Section 2: Database  (passed on `e2a4a29`, 2026-10-30)

- [PASS] 2.1 RLS on for every table. Evidence: `select tablename, rowsecurity from pg_tables where schemaname='public'` → profiles t, tier_lists t, tier_placements t (3 rows, all true).
- [PASS] 2.2 No table public by default. Evidence: `pg_policies` → 11 policies; the only `using (true)` is `profiles are public` (SELECT), and profiles hold only username, display_name and avatar_url, which exist to be shown on `/u/<username>`. Grants: anon has SELECT only (band_results, profiles, tier_lists, tier_placements; row policies apply); authenticated has INSERT/SELECT on tier_lists, UPDATE limited to columns claimed_rank, is_public, proof_url, no DELETE on tier_lists. `list_bands` is revoked from both roles; `band_results` is an owner-rights view exposing aggregates only (by design, README). `save_list` executes for authenticated only. No storage buckets: `grep -rn "storage\." src` → nothing.
  Residual risks (not blockers, decision for Danny): (a) `proof_url` and `user_id` are readable on any public list through the `public lists read` policy, so a player's Buckler profile link is visible to anyone with the anon key, not only to Danny; (b) `band_results` exposes a band's exact averages even when it has 1 list, and private lists count in it, so a band with one list reveals that list's content (not its owner). Server-side minimum (`having count >= N`) would close (b).
- [PASS] 2.3 Cross-user access refused. Evidence (local Postgres, roles + JWT claims as PostgREST sets them; A = anonymous voter, B = Discord user with profile, one public and one private list):
  - as A, `select * from tier_lists` → A's own list and B's public list only; B's private list (patch 2026-09) absent.
  - as A, `update tier_lists … where user_id = B` → 0 rows; `delete from tier_placements` for B's lists → 0 rows.
  - as A, insert placement into B's list → "new row violates row-level security policy"; insert list with user_id = B → same; insert own list with verification='approved' → same.
  - as A, `update tier_lists set verification='approved'` → "permission denied for table tier_lists" (column grant); `delete from tier_lists` → permission denied.
  - as A, update B's profile → 0 rows; insert profile with B's id → RLS error; with an `is_anonymous: true` JWT, insert profile → RLS error.
  - as A, B's placements visible → only the public list's row.
  - as anon, `select from tier_lists` → B's public list only; insert → permission denied; `select from list_bands` → permission denied; `band_results` readable.

## Section 3: Authentication and access

- [PASS] 3.1 Protected endpoints check the session server-side. The app has no API routes or server actions of its own (`find src -name route.ts* -o -name middleware.ts` → none; `grep -rn '"use server"' src` → none). Every read and write goes from the browser to Supabase's REST API, which authenticates the JWT and applies the row policies tested in 2.3 (signed-out requests get the `anon` role: no inserts, public rows only). The only server code (`src/app/u/[username]/page.tsx` metadata and `opengraph-image.tsx`) uses the signed-out client, so it can read nothing a visitor couldn't.
- [N/A] 3.2 No code bypasses the database rules: no service-role or admin key exists in the project (1.4 evidence). The two owner-rights objects (`band_results` view, `save_list()`) were checked in 2.2/2.3: the view exposes aggregates only; the function runs as the caller (`security invoker`, `004_save_list.sql:13`) so policies still apply.
- [PASS] 3.3 No admin or debug endpoints. Evidence: production build routes are `/`, `/_not-found`, `/u/[username]`, `/u/[username]/opengraph-image` only; on the local production server `/admin`, `/debug`, `/api/test`, `/api/graphql`, `/graphql`, `/swagger`, `/api-docs`, `/.env`, `/.git/HEAD` all return 404. Verification approval is done by Danny in the Supabase dashboard, not through the site.
- [MANUAL] 3.4 Rate limiting. Sign-in is Discord OAuth through Supabase Auth (`src/lib/account.ts:31-41`); voting creates an anonymous Supabase user (`src/lib/store.ts:115`). There is no password reset or contact form, and no app endpoint of our own to limit. The limits that matter are Supabase Auth's (Authentication → Rate Limits: "Anonymous users", "Sign ups and sign ins"). The sandbox cannot reach *.supabase.co, so the 30-request test cannot be run from here. Waiting on Danny to confirm the values shown in the dashboard. Known limitation whatever the values: the anonymous-user limit is the only brake on one person creating many lists from one device (vote stuffing); results need the `verified` field and a sign-in filter (issue #7) to be robust.
- [N/A] 3.5 Session cookies and CSRF. The site sets no cookies at all: `curl -D -` on `/` and `/u/danny` shows no `Set-Cookie`. supabase-js (`createClient` with defaults, `src/lib/store.ts:23`) keeps the session in `localStorage` and sends it as a `Authorization: Bearer` header, so there is no ambient credential for CSRF to ride on. Trade-off: an XSS hole would expose the token, which is why 4.3 matters.
- [N/A] 3.6 CORS. The Next server sends no `Access-Control-*` headers; an `OPTIONS` preflight from `https://evil.example` gets 400. Supabase's REST API answers any origin by design, but with bearer-token auth (3.5) a foreign page cannot use a visitor's session; it can only do what the public anon key allows (section 2).
- [N/A] 3.7 Passwords. None handled: `grep -rni password src supabase` → nothing. Identity is Discord OAuth and anonymous users, both managed by Supabase Auth.

## Section 4: Input, uploads and payments

- [TODO] 4.1 Server-side schema validation of all input.
- [TODO] 4.2 Parameterised queries; no string-built SQL/shell.
- [TODO] 4.3 XSS: payloads in every text field, nothing executes; no unsafe HTML sinks with user data.
- [TODO] 4.4 HTTPS everywhere, HTTP redirects; CSP, nosniff, Referrer-Policy, frame-ancestors, HSTS.
- [TODO] 4.5 Uploads checked by content and size on the server.
- [TODO] 4.6 Uploaded files can never run.
- [TODO] 4.7 Payment webhooks verify signatures.

## Section 5: Errors, logging and data

- [TODO] 5.1 No stack traces/SQL/paths in error responses.
- [TODO] 5.2 Friendly error messages in the UI.
- [TODO] 5.3 Errors, failed logins, admin actions logged without secrets/personal data.
- [TODO] 5.4 Backups on and one restore tested.
- [TODO] 5.5 UK GDPR/PECR: privacy notice, cookie consent, account deletion. (Built ahead of this section in PR #19 at the coordinator's request; evidence to be recorded when section 5 runs.)

## Section 6: UX robustness

- [TODO] 6.1 Double submit creates one record.
- [TODO] 6.2 Mobile keyboard does not cover the active field.
- [TODO] 6.3 Back does not wipe a form.
- [TODO] 6.4 Dark and light mode both readable.

## Section 7: Tests

- [TODO] 7.1 Unit tests for core logic, all pass.
- [TODO] 7.2 E2E tests for sign-up, log-in, main action, payment; pass on production build.
- [TODO] 7.3 Every FAIL fixed in 1-6 has a test.

## Section 8: Attack pass

- [TODO] 8.1 Authentication bypass.
- [TODO] 8.2 Broken access.
- [TODO] 8.3 Injection.
- [TODO] 8.4 XSS / HTML injection.
- [TODO] 8.5 CSRF and clickjacking.
- [TODO] 8.6 Upload abuse.
- [TODO] 8.7 Payment/webhook spoofing, price tampering.
- [TODO] 8.8 Secrets: bundle, source maps, /.env, /.git/, backups, verbose errors.
- [TODO] 8.9 Rate limits and logic: brute force, replay, races.
- [TODO] 8.10 Independent scan (ZAP baseline / security review).

## Final verdict

TODO
