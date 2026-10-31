# Character portraits

Drop one image per character into a folder named by the game id, named by the character's
id (its name in `src/lib/games.json`, lowercased with dashes), for example `sf6/ryu.png`,
`sf6/chun-li.png`, `tekken8/jin-kazama.webp`, `smash/pokemon-trainer.png`. Square images, at
least 128x128, look best. Characters without an image show their initials instead.

The list of available portraits is rebuilt automatically on `npm run dev` and `npm run build`.

Who owns the art is your call. Official renders belong to each game's publisher, and
Capcom's fan content guidelines, for one, do not cover using their images as-is. Art you drew or
commissioned is yours.
