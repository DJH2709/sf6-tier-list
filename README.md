# SF6 Community Tier List

Street Fighter 6 tier lists voted by the community, split by player rank.

## Run it

```
npm install
npm run dev
```

With no settings it runs in demo mode and saves votes in your browser only.

## Go live with Supabase (free tier)

1. Create a Supabase project, then run `supabase/schema.sql`, `supabase/002_profiles.sql`, `supabase/003_edit_lists.sql` and `supabase/004_save_list.sql` in its SQL editor, in that order.
2. Under Authentication, turn on anonymous sign-ins.
3. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
4. Deploy to Vercel with the same settings.

## Checking top-rank proof

Grand Master, Ultimate Master and Legend lists count in the Advanced band until checked.
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

## Follows, likes and tags

Players with a username can follow each other (/following shows the latest public list from
everyone they follow) and give a thumbs up to other players' public lists. Run
`supabase/006_follows_likes.sql` once to enable this.

Pro and Influencer tags are set by hand, never by the player: in the Supabase table editor, open
`profiles` and set `tag` to `pro` or `influencer` (or empty to remove it).

## Character portraits

Drop one image per character into `public/characters/`, named by the character id
(`ryu.png`, `chun-li.png`, `e-honda.webp`). See `public/characters/README.md` for the
copyright note. Characters without an image show coloured initials.
