# Hang Tickets

A social wine app with two layers:

- **Hang Tickets** — an Instagram-style photo feed of bottles people actually opened
- **Canonical cellar** — a shared database of wines (`canonical_wines`) that posts can attach to

Phase 2 wires Supabase auth and the photo upload pipeline. Wine search is still a shortcut: uploads attach to the first row in `canonical_wines`.

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

1. [`supabase/schema.sql`](supabase/schema.sql) — tables, RLS, profile trigger
2. [`supabase/storage.sql`](supabase/storage.sql) — `hang_images` bucket + storage policies
3. [`supabase/seed.sql`](supabase/seed.sql) — one placeholder wine for uploads

Then in **Authentication → Providers → Email**, keep Email enabled. For the fastest prototype, turn off **Confirm email** so a new account can sign in immediately.

Add `http://localhost:3847` (and later your production URL) under **Authentication → URL Configuration**.

## Routes

| Tab     | Path       | Status                                      |
| ------- | ---------- | ------------------------------------------- |
| Feed    | `/`        | Live `hang_tickets`, newest first           |
| Upload  | `/upload`  | Photo + rating + note → Storage + insert    |
| Profile | `/profile` | Signed-in cellar, or a sign-in prompt       |
| Sign in | `/login`   | Email / password, with create-account       |

## Stack

Next.js (App Router), React, Tailwind CSS, shadcn/ui, Lucide icons, Supabase (Postgres, Auth, Storage).
