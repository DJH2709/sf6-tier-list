# SEO check: LobbyTier (2026-11-08)

Run with the rank-on-google checklist. Brief with full context: `Project 6/seo/SEO-HANDOFF.md` in the project files.
Google's live docs (developers.google.com) are blocked from the cloud session, so this run used the checklist as written, not a fresh read of Search Essentials.

Target searches (volumes **unknown**, no keyword tool used): "overwatch tier list by rank", "overwatch hero tier list", "siege operator tier list", "clash royale card tier list", "valorant agent tier list", "invincible vs tier list", "rivals of aether 2 tier list", "city of the wolves tier list". Head terms belong to stats sites (u.gg, op.gg, RoyaleAPI, Game8); the realistic aim is the "by rank" long tail and the small fighting games.
Not local, so Section 8 (Business Profile) is N/A.

| Item | Status | Evidence | Next action |
|---|---|---|---|
| 1.1 Indexable | PASS | robots.txt `Allow: /`; previews send `X-Robots-Tag: noindex` (next.config.ts); production pages 200 | - |
| 1.2 Sitemap + robots | PASS | /sitemap.xml lists 24 games + 4 pages | Add `lastmod` later |
| 1.3 Canonical | PASS | PR #45: `alternates.canonical` on every public page (src/lib/seo.tsx) | `?tab=weapons` shares the Valorant canonical |
| 1.4 Content in HTML | PASS (this PR) | Local build with a stand-in database: raw HTML of /overwatch has "Average of 6 lists from Beginner players… S Freja 5.0 A Lúcio 4.2…" and the 54-hero roster | Danny checks the live page after merge |
| 1.5 Real 404s | PASS | `dynamicParams = false`, unknown game -> notFound() | - |
| 1.6 Redirects | PASS | PR #45: /sf6 -> / is 308 | - |
| 1.7 Search Console + Bing | OWNER | Domain verified; sitemap not submitted; no Bing | Submit sitemap, request indexing, add Bing |
| 2.1 Titles | PASS | "{game} Tier List by Rank (Community Votes) · LobbyTier" | Check CTR after 28 days |
| 2.2 Descriptions | WARN | One template for 24 games | Per-game lines once there's data |
| 2.3 One H1 naming the game | PASS | PR #45: "The Overwatch tier list that changes with your rank" | - |
| 2.4 First 100 words | PASS | Eyebrow + H1 + intro name the game and the point | - |
| 3.x Helpful content | FAIL | Most bands are empty, so results pages are thin | Real lists (OW first): no code fixes this |
| 4.4 BreadcrumbList / WebSite | PASS (code) | PR #45 JSON-LD | Danny runs Rich Results Test on the live URL |
| 4.x Ratings markup | N/A on purpose | Votes are not reviews; no AggregateRating | - |
| 5.1 Core Web Vitals | UNKNOWN | Cloud can't reach lobbytier.com | Danny runs PageSpeed Insights |
| 5.x Caching | WARN | Pages are `no-store` because language comes from a cookie | Language URLs + hreflang (later PR) |
| i18n hreflang | FAIL | Language lives in a cookie, so only English can be indexed | Later, 4/10 before English ranks |
| 11.1 Baseline | OWNER | Vercel Analytics 3 Nov: 96 visitors/7 days | Record Search Console numbers on 2026-12-06 |

Re-check date: 2026-12-06 (4 weeks).
