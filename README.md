# Hang Tickets

A social wine app with two layers:

- **Hang Tickets** — an Instagram-style photo feed of bottles people actually opened
- **Canonical cellar** — a shared database of wines (`canonical_wines`) that posts can attach to

The home feed is a hybrid discovery ranking, not a raw chronological list. Follow people from posts or profiles; posts from accounts you follow carry at least half of the ranking weight.

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
3. [`supabase/seed.sql`](supabase/seed.sql) — placeholder wines for search
4. [`supabase/profiles-display-name.sql`](supabase/profiles-display-name.sql) — nicknames on existing projects (safe to re-run)

Then in **Authentication → Providers → Email**, keep Email enabled. For the fastest prototype, turn off **Confirm email** so a new account can sign in immediately.

Add `http://localhost:3847` and the production URL under **Authentication → URL Configuration**.

## Follows and the discovery feed

`follows` is public-read. Authenticated users can insert or delete only their own `follower_id` rows (enforced by RLS). The UI updates follow state immediately, then writes through to Postgres.

Feed scoring runs in the Next.js client (`lib/feed-rank.ts`) against tickets already readable under RLS:

| Signal | Weight | Source |
| ------ | ------ | ------ |
| Social | 55% | Author is in the viewer’s follow graph |
| Taste | 30% | Overlap with bottles the viewer rated 4–5 (same wine, grapes, winery, or region) |
| Recency | 15% | Exponential decay, 72-hour half-life |

Signed-out visitors see recency only. Taste matching uses wine metadata already on `canonical_wines` — no embedding model or background taste-vector worker in this slice.

## Production

- GitHub: [shiragelb/wineApp](https://github.com/shiragelb/wineApp)
- Vercel project: `shira17/wine-app`
- Live URL: [https://wine-app-eta.vercel.app](https://wine-app-eta.vercel.app)

Set these in the Vercel project (Production):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

Then add `https://wine-app-eta.vercel.app` in Vercel → Settings → Domains, and in Supabase → Authentication → URL Configuration.

## Routes

| Tab     | Path             | Status                                                         |
| ------- | ---------------- | -------------------------------------------------------------- |
| Feed    | `/`              | Hybrid discovery feed + wine search                            |
| Upload  | `/upload`        | Photo + searchable wine + rating + note                        |
| Profile | `/profile`       | Your cellar, follow counts, edit nickname and avatar           |
| User    | `/u/[username]`  | Public cellar, follow / unfollow, bottles they hung            |
| Wine    | `/wine/[id]`     | Hang tickets for one canonical wine                            |
| Sign in | `/login`         | Email / password, with create-account                          |

Feed and Profile keep SWR cache in the shell, so switching tabs does not wait on a fresh database round-trip.

## Stack

Next.js (App Router), React, Tailwind CSS, shadcn/ui, Lucide icons, SWR, Supabase (Postgres, Auth, Storage).
