# Polish check - LobbyTier (website-polish-static, then website-polish-dynamic for the app parts)

Started 2026-10-31 on the branch after PR #22. Statuses: TODO, PASS, FAIL, N/A, MANUAL (real phone, Danny).
This is a Next.js 15 app on Vercel with Supabase, not Astro on Cloudflare, so the skill's snippets are translated.
All checks below ran against `next build` + `next start` on port 3918 with a fake Supabase REST server on 54329
(`scratchpad/fake2.js`), so data fetches return empty or one sample profile (`/u/danny`).

## Inventory

- Routes: `/` (SF6 home), `/[game]` (nine more games), `/players`, `/following`, `/privacy`, `/terms`, `/u/[username]` (+ `/u/[username]/opengraph-image`), plus `error` and `not-found` pages.
- Images above the fold: none (no hero image). Character portraits in tiles are optional files under `public/characters/<game>/`; none are present today, so tiles show initials. Discord avatars on profiles and the players list.
- Sticky or fixed: one `sticky top-0` bar in the placement step (`PlaceCharacters.tsx`); nothing fixed to a screen edge.
- Menus: two native `<select>`s (language, rank); "More sign-in options" expands in place. No hover flyouts.
- Number tables: community averages on tiles, like and follower counts, "n lists" per band.
- Forms: proof-link input (top ranks), username picker after first sign-in. Both post to Supabase, not a form service.
- Custom fonts: none at the start (`system-ui`); the unslop pass added Geist and Geist Mono, self-hosted through next/font (`src/app/fonts.ts`).
- Analytics: none.
- The one action: "Make your tier list".

## Baseline (before any polish work), 2026-10-31

Lighthouse 12, mobile, simulated throttling, on the local production build of `/sf6` (fake Supabase, so two data fetches fail and log console errors, which drags Best Practices down):

| Performance | Accessibility | Best practices | SEO | LCP | CLS | Page weight |
| --- | --- | --- | --- | --- | --- | --- |
| 72 | 96 | 79 | 100 | 3.2 s | 0.185 | 273 KiB |

Fails to fix: CLS 0.185 (target < 0.1); colour contrast on the `text-neutral-500` "n lists" labels in the band cards; LCP 3.2 s (target < 2.5 s). Passing already: alt text, link and button names, title and description, viewport, font sizes, crawlable.

## Section A: Foundations

- [PASS] A1 Reduced motion. `src/app/globals.css` has the `prefers-reduced-motion` block (transitions, animations and smooth scroll off); the only JavaScript motion is `scrollIntoView({ behavior: "smooth" })`, which that CSS also turns off. Evidence: `scratchpad/after/polish-check.js` emulates reduced motion on 8 routes and counts elements with a transition or animation longer than 0.01 ms: `0 moving` on every route (2026-10-31 09:50).
- [PASS] A2 No layout shift. Every `<img>` has `width` and `height` (`Portrait` and `PlayerAvatar` take a `px` prop, the account avatar is 24×24): the same script found `0` images without dimensions on every route. Fonts use `font-display: swap` with next/font's size-adjusted fallback. The 0.185 baseline shift was the header growing when the account bar appeared after the session loaded, which pushed the whole hero down; the header now reserves the account row (`SiteHeader.tsx`, `AccountBar` renders a 36 px placeholder while loading). Lighthouse CLS after: **0** on `/` (three runs) and `/players`.
- [PASS] A3 Visible keyboard focus. `:focus-visible { outline: 2px solid #34d399; outline-offset: 2px }` in `globals.css`; `grep -rn "outline-none\|outline: none" src` finds nothing. Tabbing through the home page shows the ring on the language select, sign-in button, game links, both hero buttons and the band cards (`scratchpad/after/home-desktop-top.png` is the page; the ring was checked by hand in the same session).
- [PASS] A4 Mobile height. `grep -rn "min-h-screen\|h-screen" src` → nothing; the seven page wrappers use `min-h-dvh`.
- [PASS] A5 Anchors under a sticky header. The only sticky element is the placement-progress bar inside the form, and the one in-page jump (`#app`, from the hero buttons) lands above it. `scroll-mt-4` is set on `#app`. Clicking "See community results" at 375 px puts the tab bar fully in view (checked in the screenshot run).
- [PASS] A6 Basics. Custom 404 keeps the site's language and a home button (`/does-not-exist` → HTTP 404, `/u/nobody` → 404 page, `curl -s -o /dev/null -w "%{http_code}" localhost:3918/nope` → `404`). Favicon set: `src/app/icon.svg` (three tier bars) + `src/app/apple-icon.png` (180×180, rendered from the SVG) + the old `favicon.ico`; the HTML carries all three `<link rel="icon">`/`apple-touch-icon` tags. Titles and descriptions per route (all different): `/` "Street Fighter 6 Community Tier List", `/tekken8` "Tekken 8 Community Tier List", `/players` "Players · …", `/following` "Following · …", `/privacy` "Privacy · LobbyTier", `/terms` "Terms · LobbyTier", `/u/danny` "Danny's tier lists", each with its own description (`curl` of each route, 09:52). Open Graph: `metadataBase` is set to `https://lobbytier.com`, `twitter:card` is `summary_large_image`, and 1200×630 images now exist for the home page, every game page and every profile (`src/components/og.tsx`, `scratchpad/after/og-home.png`). **Finding:** Next.js 15 streams `<title>`/`<meta>` into the `<body>` for normal browsers and only renders them in `<head>` for a short list of bots, which made Lighthouse's SEO audit report "no meta description" (score 91). Fixed with `htmlLimitedBots: /./` in `next.config.ts`, so every visitor gets the tags in `<head>`; SEO is 100 after. Danny: once the PR is live, paste https://lobbytier.com into https://www.opengraph.xyz to see the card.

## Section B: Content polish

- [PASS] B1 Balanced headlines. `h1, h2, h3 { text-wrap: balance }` and `p, li { text-wrap: pretty }` in `globals.css`; no forced `<br>` in any heading (`grep -rn "<br" src` finds only the setup-error paragraph). Hero at 375 and 1440: `scratchpad/after/home-mobile-top.png`, `home-desktop-top.png`.
- [PASS] B2 Tabular numbers. Averages on tiles, like counts, follower lines, "n lists", the placement counter and step numbers are `font-mono tabular-nums`; numbers inside sentences are not.
- [N/A] B3 Image placeholders. No hero or content images; portraits are optional 28 px tiles with `loading="lazy"` and a solid badge behind them. Avatars are 40 or 80 px.
- [N/A] B4 Safe area insets. Nothing is fixed to a screen edge: `grep -rn "fixed\|sticky" src` finds only the in-form progress bar, which is sticky to the top inside the page flow with a solid background. `viewport-fit=cover` not added on purpose.
- [PASS] B5 Tap targets. The polish-check script measures every `a, button, input, select` at 375 px, exempting links inside running text (`p`, `li`, WCAG 2.5.8): `0` targets under 24×24 on all 8 routes. Main buttons are 44 px tall, controls 36 px, footer and text links at least 24 px. Icon-only controls: none (the like button carries its count).
- [PASS] B6 Prerendering. `next build` output: `/[game]` is SSG for all ten games, `/robots.txt`, `/sitemap.xml`, `/icon.svg`, `/apple-icon.png` static; `/`, `/players`, `/following`, legal and profile pages are server-rendered per request because the language cookie is read. `next/link` prefetches on hover/viewport by default. Speculation Rules not added (client-side router already does the prefetch).
- [PASS] B7 Menus. Two native `<select>`s and a click-to-expand "More sign-in options"; no hover menus. Keyboard: arrow keys change the select, Escape closes it (native).
- [N/A] B8 View transitions. Navigation is Next's client-side router, which the CSS `@view-transition` rule does not cover; the experimental `viewTransition` flag is not worth the risk before launch.
- [PASS] B9 Form polish. Proof link: `<label>`, `type="url"`, `inputmode="url"`, `autocomplete="url"`, `maxlength=300`, server-side check in `save_list()` (launch-check 4.1). Username: `<label>` (visually hidden), `autocomplete="username"`, `autocapitalize="none"`, `spellcheck=false`, `maxlength=20`, `required`, error shown under the field in words, submit button disabled with "Saving..." while saving (`MakeList.tsx`), success message replaces the form state. Submit-empty / invalid screenshots need a real sign-in and are left for Danny's live test.
- [N/A] B10 Continuous corners: cosmetic, skipped on purpose.

## Section C: Launch basics

- [PASS] C1 Sitemap and robots.txt. `src/app/robots.ts` and `src/app/sitemap.ts`. `curl localhost:3918/robots.txt` → `User-Agent: * / Allow: / / Sitemap: https://lobbytier.com/sitemap.xml`; `curl localhost:3918/sitemap.xml` lists 13 URLs: `/` and the nine game pages, `/players`, `/privacy`, `/terms`. `/following` is personal and `/u/*` are found through links, so neither is listed. Preview deployments send `X-Robots-Tag: noindex` (`next.config.ts`, when `VERCEL_ENV` is not `production`); the local production build sends none. After launch: submit the sitemap in Google Search Console.
- [PASS] C2 Images compressed and sized. The only images in the repo are `icon.svg` (0.4 KB), `apple-icon.png` (1.4 KB) and `favicon.ico`; `find public src -size +100k -name "*.png" -o -size +100k -name "*.jpg"` → nothing. OG images are rendered on request as PNG (home: 54 KB). Lighthouse raises no image warnings.
- [PASS] C3 Page speed (lab). Lighthouse 12, mobile, simulated slow 4G, three runs on `/` after the work:

  | Run | Performance | Accessibility | Best practices | SEO | LCP | CLS | Weight |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | 1 | 93 | 100 | 82 | 100 | 3.0 s | 0 | 392 KiB |
  | 2 | 92 | 100 | 82 | 100 | 3.2 s | 0 | 392 KiB |
  | 3 | 90 | 100 | 82 | 100 | 3.3 s | 0 | 392 KiB |
  | median | 92 | 100 | 82 | 100 | 3.2 s | 0 | 392 KiB |
  | after fonts.ts (mono not preloaded), 2 runs | 94 / 93 | 100 | 82 | 100 | 2.9 s / 2.9 s | 0 | 392 KiB |

  `/players`: 93 / 100 / 82 / 100, LCP 3.0 s, CLS 0. Best practices 82 is one deprecation warning from the **fake** server's `Access-Control-Allow-Headers: *` (not the site). LCP stays above the 2.5 s target in the lab: the breakdown says TTFB 17 ms + render delay 116 ms, so the 2.9 s is the simulator's slow-4G model of 103 KB of first-load JavaScript, not something a cheaper font or image fixes. Real-user LCP will be checked in PageSpeed Insights once lobbytier.com has traffic. Weight is 392 KiB (two 70 KB font files replaced the system font), under the 1 MB budget.
- [PASS] C4 Mobile friendly. Viewport meta is Next's default `width=device-width, initial-scale=1` with zoom allowed. The polish-check script measures `scrollWidth - innerWidth` at 320, 375 and 768 px on 8 routes: all `0` after the header was allowed to wrap (the first run had 9 to 33 px of overflow on five routes). Body text 16 px, meta labels 12 px mono. Screenshots: `scratchpad/after/*-mobile.png`. **MANUAL:** one look by Danny on his phone (see the PR message).
- [PASS] C5 Alt text. `scratchpad/axe/run.js` runs axe-core 4 (WCAG 2.2 AA + best practice) on 7 routes at 375 px: `ALL CLEAN` after three fixes it found (step headings skipped h2 → `Step.tsx` uses h2; the list, profile and legal pages had no `<main>` landmark → added; the hero sat outside any landmark → `<section aria-labelledby>`). All images are decorative (`alt=""`, name shown as text next to them); icon-only controls: none; the like button has `aria-label` "Like this list: 3".
- [PASS] C6 No broken links. `npx linkinator http://localhost:3918/ --recurse` over 50 links: every internal page, asset and anchor resolves. The 13 "broken" entries it listed are the absolute `https://lobbytier.com/…/opengraph-image` URLs (the sandbox can't reach the internet) and are served locally with HTTP 200. External links by hand: github.com/DJH2709/sf6-tier-list/issues 200; github.com/DJH2709 403 is GitHub's bot block; discord.com, supabase.com, vercel.com, policies.google.com and ico.org.uk could not be fetched from the sandbox (proxy), so Danny clicks those five once on the live site.
- [MANUAL] C7 Analytics. None installed, and none added here (Danny's call, it adds a script to the CSP). Recommendation: Vercel Web Analytics (cookieless, no consent banner, one package and one line in `layout.tsx`, plus `https://va.vercel-scripts.com` in `script-src`/`connect-src`). The two numbers to watch: visits per game page and lists submitted (count of `tier_lists` rows per day in Supabase, no tracker needed).
- [PASS] C8 One clear call to action. Home/game pages: "Make your tier list" is the only emerald button, above the fold at 375 and 1440 (`home-mobile-top.png`, `home-desktop-top.png`); "See community results" and sign-in are quiet. Profile: "Make your own" (primary) next to a secondary "Share". Players and Following: the list rows lead to profiles, which lead to "Make your own". Legal pages: footer links back home. No dead ends: the 404 and error pages have a home button.

## Final check

- [PASS] Lighthouse all four categories on the production build (table in C3): Accessibility 100, SEO 100, CLS 0; Performance 90 to 94; LCP 2.9 to 3.3 s lab (see C3 for why that's not pursued further before launch). No contrast failure (the baseline one on "n lists" is fixed by the new palette: muted text is 4.9:1 on cards, secondary text used on raised surfaces).
- [N/A] Impeccable audit: not installed. The unslop checklist (`Project 6/design/UNSLOP-AUDIT.md`) was the second opinion.
- [MANUAL] Real-phone pass by Danny (B5, C4): open https://lobbytier.com after the PR deploys, tap every button on the home page and the make-list form with a thumb, scroll a tier list sideways, and say "phone ok" or what looked wrong.
- Next: `website-polish-dynamic` for the app parts (the make-list form, likes and follows), then `dont-sue-me`. `website-launch-check` already ran (LAUNCH-CHECK.md).
