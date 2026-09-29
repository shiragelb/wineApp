# Hang Tickets

Look up a bottle and see what friends actually thought before you buy. Hang tickets are still there — they live on the **Friends** tab, not the home screen.

## Run locally

```bash
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

The app listens on [http://localhost:3847](http://localhost:3847).

## Supabase setup

Run these in the SQL Editor, in order:

1. [`supabase/schema.sql`](supabase/schema.sql) — tables, RLS (including `follows`), profile trigger
2. [`supabase/storage.sql`](supabase/storage.sql) — `hang_images` bucket + storage policies
3. [`supabase/seed.sql`](supabase/seed.sql) — placeholder wines for search and color browse
4. [`supabase/profiles-display-name.sql`](supabase/profiles-display-name.sql) — nicknames on existing projects (safe to re-run)
5. [`supabase/social-extras.sql`](supabase/social-extras.sql) — optional: mute table, ticket price, wine color

Color browse works without step 5 (color is inferred from the wine name and grapes). Mute works on this device without it; run the SQL so mutes sync across devices. Average price on a wine appears after tickets include an optional price.

## Cellar home

`/` asks for a color (red, white, rosé, orange), then a region, then shows friends’ highly rated bottles in that slice plus a grid of matching wines. Search is still on the home header if you already know the name.

The **Friends** tab (`/feed`) is the ranked photo feed: 55% people you follow, 30% taste overlap, 15% recency. Muted accounts are hidden there.

## Production

- GitHub: [shiragelb/wineApp](https://github.com/shiragelb/wineApp)
- Vercel project: `shira17/wine-app`
- Live URL: [https://wine-app-eta.vercel.app](https://wine-app-eta.vercel.app)

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) in Vercel.

## Routes

| Tab / page | Path | What it is |
| --- | --- | --- |
| Cellar | `/` | Color → region browse, wine search |
| Friends | `/feed` | Ranked hang-ticket feed |
| Hang | `/upload` | Photo + wine + rating + optional price |
| You | `/profile` | Your tickets; gear opens settings |
| Settings | `/settings` | Edit profile, notifications, mute, sign out |
| People | `/people` | Search drinkers by username or nickname |
| Notifications | `/notifications` | New followers and friends’ pours |
| User | `/u/[username]` | Public cellar |
| Follow lists | `/u/[username]/followers` and `/following` | Clickable people, follow / mute |
| Wine | `/wine/[id]` | Verdict (avg score, tickets, friends, avg price) + Friends / Everyone |

## Stack

Next.js (App Router), React, Tailwind CSS, shadcn/ui, Lucide icons, SWR, Supabase (Postgres, Auth, Storage).
