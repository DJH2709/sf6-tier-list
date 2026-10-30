# SF6 Community Tier List

Street Fighter 6 tier lists voted by the community, split by player rank.

## Run it

```
npm install
npm run dev
```

With no settings it runs in demo mode and saves votes in your browser only.

## Go live with Supabase (free tier)

1. Create a Supabase project, then run `supabase/schema.sql` in its SQL editor.
2. Under Authentication, turn on anonymous sign-ins.
3. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
4. Deploy to Vercel with the same settings.

## Checking top-rank proof

Grand Master, Ultimate Master and Legend lists count in the Advanced band until checked.
Open the `tier_lists` table, look at `proof_url` for rows marked `pending`, and set
`verification` to `approved` or `rejected`.
