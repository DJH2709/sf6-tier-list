# Fighting Game Community Tier Lists

Tier lists for ten fighting games, voted by the community and split by player rank.
Street Fighter 6 is at `/`; the others are at `/tekken8`, `/smash`, `/mk1`, `/ggst`, `/2xko`,
`/brawlhalla`, `/rivals2`, `/cotw` and `/gbvsr`.

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

## Editing and private lists

A player has one list per patch. Opening "Make your list" again loads that list for editing,
and saving replaces it. When a new patch starts, the maker pre-fills from their last list so they
only move what changed. Signed-in players can untick "Show on my profile" to keep a list off
their public page; it still counts in the community results.

Run `supabase/003_edit_lists.sql` once to enable this (it also stores Discord avatars), then
`supabase/004_save_list.sql`, which saves a list and its placements in one go so a failed save
can't leave a list half replaced.

## Character portraits

Drop one image per character into `public/characters/<game id>/`, named by the character id
(`sf6/ryu.png`, `sf6/chun-li.png`, `tekken8/jin-kazama.webp`). See `public/characters/README.md` for the
copyright note. Characters without an image show coloured initials.
