# Character portraits

One image per character, in a folder named by the game id, named by the character's id (its
name in `src/lib/games.json`, lowercased with dashes), for example `overwatch/lucio.webp`,
`clashroyale/mini-p-e-k-k-a.webp`, `siege/jager.webp`. Characters without an image show their
initials (or their name in "Pictures only" view). The list of available portraits is rebuilt
automatically on `npm run dev` and `npm run build`.

## Where the current pictures come from, and why they're allowed

Checked 2026-11-01. The site is non-commercial; every permission below depends on that.

| Game | Source | Permission |
| --- | --- | --- |
| Clash Royale | [outlierSlug/immaculate-grid-engine](https://github.com/outlierSlug/immaculate-grid-engine) `frontend/public/clashroyale/icons/` (Supercell's own card icons from its API asset CDN, with evo and hero frames; current to 2026-10-27) | [Supercell Fan Content Policy](https://supercell.com/fan-content-policy): non-commercial fan content may display Supercell assets unmodified, with the disclaimer shown in the footer. Only the transparent margin is trimmed; never crop or edit the art (tiles use `object-contain`). |
| Overwatch | [drippinghere/overwatch-hero-icons](https://github.com/drippinghere/overwatch-hero-icons) `2d/` (Blizzard hero icons) | Blizzard's Legal FAQ allows non-commercial fan sites to display Blizzard material, keeping the copyright notice. Revocable at any time. |
| Rainbow Six Siege | [zerobertoo/r6operators](https://github.com/zerobertoo/r6operators) (hand-redrawn operator badges, MIT) | Grey area: Ubisoft has no fan policy for images. The MIT licence covers the redrawing, not Ubisoft's rights in the designs. Remove the folder if Ubisoft asks. |
| Valorant (agents and weapons), League of Legends, Wild Rift | Riot's own files: [valorant-api.com](https://valorant-api.com) (agent icons, weapon pictures) and Data Dragon (League champion squares; Wild Rift has no CDN, so it uses the League squares of the same champions). Fetched by `scripts/fetch-riot-packs.mjs`. Checked 2026-11-03. | [Riot's "Legal Jibber Jabber"](https://www.riotgames.com/en/legal) fan policy: free, non-commercial projects may use Riot's game assets, with Riot's disclaimer (in the footer). No paywalls or donations tied to perks. Wild Rift's Norra isn't in League, so she shows her name. |
| Brawl Stars | [Brawlify/CDN](https://github.com/Brawlify/CDN) `brawlers/borderless/` (Supercell's brawler head icons, current to 2026-11-03). Brawler ids in `scripts/brawlstars-ids.json`, cross-checked against three fan databases; Buzz Lightyear, Cosmo and Vince matched by sight and description. | [Supercell Fan Content Policy](https://supercell.com/fan-content-policy), as for Clash Royale. Pictures resized only, never edited. |
| Age of Empires II, IV | [SiegeEngineers/aoe2techtree](https://github.com/SiegeEngineers/aoe2techtree) `img/Civs/` (civ emblems; Lạc Việt from `ror/`), [aoe4world/explorer](https://github.com/aoe4world/explorer) `assets/flags/` (civ flags) | [Microsoft Game Content Usage Rules](https://www.xbox.com/en-US/developers/rules): non-commercial use allowed with the notice in the footer; nothing sold, no paywall. |
| Tekken 8, MK1, Smash, Brawlhalla, Rivals II, Fatal Fury, Invincible VS | [joaorb64/StreamHelperAssets](https://github.com/joaorb64/StreamHelperAssets) `games/<code>/base_files/icon/` (MK1: `portrait/`, cut square around the eyes; Fatal Fury: cut square from the top) | No published permission either way (no fan content policy found on 2026-11-01). Danny chose to use them anyway on 2026-11-01, accepting takedown risk. Remove a game's folder if its publisher asks. |

Re-import after a roster change with `scripts/import-portraits.mjs` (instructions at its top).
Characters missing from a pack (10 newer Brawlhalla legends) show their name until the pack catches up.

## Games and characters without pictures, on purpose

- Marvel Rivals, Mobile Legends, Dota 2, Apex Legends, Deadlock: no fan content policy checked yet (NetEase, Moonton, Valve, EA). Marvel Rivals stays out (Marvel/Disney IP, no policy).
- Street Fighter 6: Capcom's fan content guidelines don't cover copies of their material without creative input.
- Capcom guest characters in other games (Smash's Ryu, Ken and Mega Man; Fatal Fury's Ken and Chun-Li), for the same reason.
- Guilty Gear Strive: Arc System Works' fan guidelines prohibit "directly using materials of our works", including official visuals.
- Granblue Fantasy Versus Rising: Cygames IP, made by Arc System Works; left out with Strive.

`tests/portraits.test.mjs` fails if any of these get a picture.

Art you drew or commissioned yourself is yours to use.
