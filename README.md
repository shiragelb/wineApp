# Hang Tickets

A social wine app with two layers:

- **Hang Tickets** — an Instagram-style photo feed of bottles people actually opened
- **Canonical cellar** — a shared database of wines (`canonical_wines`) that posts can attach to

Phase 1 is the foundation: Supabase schema + a mobile-first Next.js shell with Feed, Upload, and Profile tabs. Auth and image upload are intentionally not wired yet.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3847](http://localhost:3847) if you start the app the same way this repo does:

```bash
npm run dev -- --port 3847
```

## Supabase schema

1. Create a Supabase project.
2. Open the SQL Editor.
3. Paste and run [`supabase/schema.sql`](supabase/schema.sql).

That file creates `profiles`, `canonical_wines`, `hang_tickets`, and `follows`, plus public-read / authenticated-insert RLS policies.

When you are ready for Phase 2, copy `.env.example` to `.env.local` and add your project URL and anon key.

## Routes

| Tab     | Path       | Status                                      |
| ------- | ---------- | ------------------------------------------- |
| Feed    | `/`        | Dummy hang-ticket cards                     |
| Upload  | `/upload`  | Form shell (no camera or submit)            |
| Profile | `/profile` | Preview profile and empty tickets grid      |

## Stack

Next.js (App Router), React, Tailwind CSS, shadcn/ui, Lucide icons, Supabase (Postgres + Auth + Storage, next).
