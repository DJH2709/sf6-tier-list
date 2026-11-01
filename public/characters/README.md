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

Re-import after a roster change with `scripts/import-portraits.mjs` (instructions at its top).
Clash Royale cards missing from the pack show initials until the pack catches up.

## Games without pictures, on purpose

- Street Fighter 6: Capcom's fan content guidelines don't cover copies of their material without creative input.
- Guilty Gear Strive: Arc System Works' fan guidelines prohibit "directly using materials of our works", including official visuals.
- Granblue Fantasy Versus Rising (Cygames), Tekken 8 (Bandai Namco), Smash (Nintendo), MK1 (Warner Bros.), Brawlhalla (Ubisoft), Rivals II (Aether Studios), Fatal Fury (SNK), Invincible VS (Skybound): no published permission for fan sites to use their art. Ask the publisher first.

Art you drew or commissioned yourself is yours to use.
