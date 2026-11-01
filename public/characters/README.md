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
| Clash Royale | [RoyaleAPI/cr-api-assets](https://github.com/RoyaleAPI/cr-api-assets) `cards-150/` (Supercell card art) | [Supercell Fan Content Policy](https://supercell.com/fan-content-policy): non-commercial fan content may display Supercell assets unmodified, with the disclaimer shown in the footer. Don't crop or edit them (tiles use `object-contain`). |
| Overwatch | [drippinghere/overwatch-hero-icons](https://github.com/drippinghere/overwatch-hero-icons) `2d/` (Blizzard hero icons) | Blizzard's Legal FAQ allows non-commercial fan sites to display Blizzard material, keeping the copyright notice. Revocable at any time. |
| Rainbow Six Siege | [zerobertoo/r6operators](https://github.com/zerobertoo/r6operators) (hand-redrawn operator badges, MIT) | Grey area: Ubisoft has no fan policy for images. The MIT licence covers the redrawing, not Ubisoft's rights in the designs. Remove the folder if Ubisoft asks. |
| Tekken 8, MK1, Smash, Brawlhalla, Rivals II, Fatal Fury, Invincible VS | [joaorb64/StreamHelperAssets](https://github.com/joaorb64/StreamHelperAssets) `games/<code>/base_files/icon/` (MK1: `portrait/`, cut square around the eyes; Fatal Fury: cut square from the top) | No published permission either way (no fan content policy found on 2026-11-01). Danny chose to use them anyway on 2026-11-01, accepting takedown risk. Remove a game's folder if its publisher asks. |

Re-import after a roster change with `scripts/import-portraits.mjs` (instructions at its top).
Characters missing from a pack (14 Clash Royale cards, 10 newer Brawlhalla legends) show their name until the pack catches up.

## Games and characters without pictures, on purpose

- Street Fighter 6: Capcom's fan content guidelines don't cover copies of their material without creative input.
- Capcom guest characters in other games (Smash's Ryu, Ken and Mega Man; Fatal Fury's Ken and Chun-Li), for the same reason.
- Guilty Gear Strive: Arc System Works' fan guidelines prohibit "directly using materials of our works", including official visuals.
- Granblue Fantasy Versus Rising: Cygames IP, made by Arc System Works; left out with Strive.

`tests/portraits.test.mjs` fails if any of these get a picture.

Art you drew or commissioned yourself is yours to use.
