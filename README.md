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
6. [`supabase/google-profiles.sql`](supabase/google-profiles.sql) — optional: copy Google name/photo into new profiles
7. [`supabase/migrations/20260930093653_wine_metadata_wineries_grapes.sql`](supabase/migrations/20260930093653_wine_metadata_wineries_grapes.sql) — wineries, wine_type, grapes JSONB, trigram search
8. [`supabase/seed_wineries_and_grapes.sql`](supabase/seed_wineries_and_grapes.sql) — renowned producers + common grape list

Color browse works without step 5 (color is inferred from the wine name/grapes). Mute works on this device without it; run the SQL so mutes sync across devices. Average price on a wine appears after tickets include an optional price. Steps 7–8 unlock Vivino-style tags, winery autocomplete, and the grape blend bar on Hang.

## Cellar home

`/` asks for a color (red, white, rosé, orange), then a region, then shows friends’ highly rated bottles in that slice plus a grid of matching wines. Search is still on the home header if you already know the name.

The **Friends** tab (`/feed`) is the ranked photo feed: 55% people you follow, 30% taste overlap, 15% recency. Muted accounts are hidden there.

## Production

- GitHub: [shiragelb/wineApp](https://github.com/shiragelb/wineApp)
- Vercel project: `shira17/wine-app`
- Live URL: [https://wine-app-eta.vercel.app](https://wine-app-eta.vercel.app)

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) in Vercel.

## Auth

Sign in and sign up are separate pages (`/login`, `/signup`). Both include **Continue with Google** plus email and password.

Google needs a Web OAuth client in Google Cloud, then those credentials in Supabase. The app cannot mint a Google client ID for you.

1. In [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients), create an OAuth client of type **Web application**.
2. Authorized JavaScript origins:
   - `http://127.0.0.1:3847`
   - `http://localhost:3847`
   - `https://wine-app-eta.vercel.app`
3. Authorized redirect URI (this is the **Supabase** callback, not the Next.js one):
   - `https://bfjbwodesljejxvebhnz.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret into **Supabase → Authentication → Providers → Google**. Enable the provider.
5. In **Supabase → Authentication → URL Configuration**, set Site URL to the app origin you use most (`http://127.0.0.1:3847` locally, `https://wine-app-eta.vercel.app` in production) and add Redirect URLs:
   - `http://127.0.0.1:3847/auth/callback`
   - `http://localhost:3847/auth/callback`
   - `https://wine-app-eta.vercel.app/auth/callback`

Until step 4 is done, the Google buttons still appear and show a clear “provider is not enabled” message.

6. Optional: run [`supabase/google-profiles.sql`](supabase/google-profiles.sql) so new Google users get their name and photo on first sign-in. The app also copies those after the OAuth callback.

## Routes

| Tab / page | Path | What it is |
| --- | --- | --- |
| Cellar | `/` | Color → region browse, wine search |
| Friends | `/feed` | Ranked hang-ticket feed |
| Hang | `/upload` | Photo + wine + rating + optional price |
| You | `/profile` | Your tickets; gear opens settings |
| Sign in | `/login` | Google or email |
| Sign up | `/signup` | Google or email + optional nickname |
| Settings | `/settings` | Edit profile, notifications, mute, sign out |
| People | `/people` | Search drinkers by username or nickname |
| Notifications | `/notifications` | New followers and friends’ pours |
| User | `/u/[username]` | Public cellar |
| Follow lists | `/u/[username]/followers` and `/following` | Clickable people, follow / mute |
| Wine | `/wine/[id]` | Verdict (avg score, tickets, friends, avg price) + Friends / Everyone |
| Explore | `/explore` | Filter cellar by winery, region, grape, or wine type |

## Stack

Next.js (App Router), React, Tailwind CSS, shadcn/ui, Lucide icons, SWR, Supabase (Postgres, Auth, Storage).
