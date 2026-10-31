# Fighting Game Community Tier Lists

Tier lists for ten fighting games, voted by the community and split by player rank.
Street Fighter 6 is at `/`; the others are at `/tekken8`, `/smash`, `/mk1`, `/ggst`,
`/brawlhalla`, `/rivals2`, `/cotw`, `/gbvsr` and `/invincible`.

## Run it

```
npm install
npm run dev
npm test
```

With no settings it runs in demo mode and saves votes in your browser only.

## Go live with Supabase (free tier)

1. Create a Supabase project, then run `supabase/schema.sql`, `supabase/002_profiles.sql`, `supabase/003_edit_lists.sql`, `supabase/004_save_list.sql` and `supabase/005_games.sql` in its SQL editor, in that order.
2. Under Authentication, turn on anonymous sign-ins.
3. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
4. Deploy to Vercel with the same settings.

## Games, rosters and rank ladders

Every game lives in `src/lib/games.json`: its roster, patch and rank ladder. Each rank sits in
one of four bands (Beginner, Intermediate, Advanced, Elite). Elite ranks need proof.

- New character or balance patch: add the name and bump that game's `patch`, so a new round of
  lists starts. Players' last lists pre-fill the new patch.
- Changed rank ladder or new game: edit the JSON, run `npm run ranks-sql`, then run the
  `insert into game_ranks` part of `supabase/005_games.sql` in the Supabase SQL editor (the
  whole file is safe to re-run). `npm test` fails if the JSON and the SQL disagree.

Character ids come from names, so renaming a character orphans its existing votes.

Only SF6 has translated game, rank and character names (`game.sf6`, `rank.<id>`, `src/locales/characters.ts`).
Other games show their English names from `games.json` in every language; see `src/lib/i18n/games.ts`.

## Checking top-rank proof

Elite ranks (SF6 Grand Master and up, Tekken King and up, and so on) count in the Advanced band until checked.
Open the `tier_lists` table, look at `proof_url` for rows marked `pending`, and set
`verification` to `approved` or `rejected`.

## Discord sign-in and public profiles

Voting works without an account. Signing in with Discord lets a player pick a username
and makes their tier lists public at `/u/<username>`.

1. In the [Discord Developer Portal](https://discord.com/developers/applications), create an
   application. Under OAuth2, copy the Client ID and Client Secret, and add the redirect
   `https://<your-project-ref>.supabase.co/auth/v1/callback`.
2. In Supabase, go to Authentication → Sign In / Providers → Discord. Turn it on and paste
   the ID and secret.
3. In Supabase, go to Authentication → Sign In / Providers and turn on **Allow manual linking**.
   This lets someone who voted before signing in keep that vote.
4. In Supabase, go to Authentication → URL Configuration. Set Site URL to your live site, and
   add `https://*-<your-vercel-team>.vercel.app/**` to Redirect URLs so previews can sign in.

## More sign-in options (Google, Kakao, X)

Discord is the default. To add more buttons, switch each provider on in Supabase first, then
list them in the `NEXT_PUBLIC_AUTH_PROVIDERS` setting in Vercel (e.g. `discord,google,kakao,x`)
and redeploy. A provider that's listed but not switched on gives a broken button. Every
provider uses the same redirect: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
The button order follows the visitor's language (Kakao first in Korean, X first in Japanese).

- **Google** (works everywhere except mainland China): in Google Cloud Console, set up the
  OAuth consent screen (External), then Credentials → Create OAuth client ID → Web application,
  with the redirect above. Paste the client ID and secret into Supabase → Sign In / Providers → Google.
- **Kakao** (Korea): on developers.kakao.com, add an app. Turn on Kakao Login and add the redirect,
  under Security generate a client secret, and under consent items turn on nickname and profile
  image. The REST API key is the client ID. Paste both into Supabase → Kakao. Kakao only shares
  email with business-verified apps, so turn on "Allow users without an email" in Supabase if it's offered.
- **X** (Japan): on developer.x.com, create a project and app, open User authentication settings,
  pick OAuth 2.0 and Web App, and add the redirect and your site URL. Paste the client ID and
  secret into Supabase → X / Twitter (OAuth 2.0).

Avatars are only stored from Discord (the database only accepts cdn.discordapp.com), so players
signing in another way get coloured initials.

## Languages

The site is in English, Japanese, Korean and Simplified Chinese. It follows the browser's
language until someone picks one in the switcher, which is remembered in a cookie. UI text lives
in `src/locales/`: add new text to `en.ts`, and other languages show English for it until it's
translated. `npm run i18n:check` lists what each language is missing. Character names use
Capcom's official names per language (`src/locales/characters.ts`). The non-English text is a
machine-assisted first pass and says so in the footer; it needs a native speaker's review.

## Editing and private lists

A player has one list per patch. Opening "Make your list" again loads that list for editing,
and saving replaces it. When a new patch starts, the maker pre-fills from their last list so they
only move what changed. Signed-in players can untick "Show on my profile" to keep a list off
their public page; it still counts in the community results.

Run `supabase/003_edit_lists.sql` once to enable this (it also stores Discord avatars), then
`supabase/004_save_list.sql`, which saves a list and its placements in one go so a failed save
can't leave a list half replaced.

## Follows, likes and tags

Players with a username can follow each other (/following shows the latest public list from
everyone they follow) and give a thumbs up to other players' public lists. Run
`supabase/006_follows_likes.sql` once to enable this.

Pro and Influencer tags are set by hand, never by the player: in the Supabase table editor, open
`profiles` and set `tag` to `pro` or `influencer` (or empty to remove it).

## Character portraits

Drop one image per character into `public/characters/<game id>/`, named by the character id
(`sf6/ryu.png`, `sf6/chun-li.png`, `tekken8/jin-kazama.webp`). See `public/characters/README.md` for the
copyright note. Characters without an image show coloured initials.
