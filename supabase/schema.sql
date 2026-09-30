-- Hang Tickets — Phase 1 schema
-- Paste this into the Supabase SQL Editor and run it once.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint username_length check (char_length(username) between 2 and 32),
  -- nickname (display_name) is not unique; username is.
  constraint display_name_length check (
    display_name is null or char_length(display_name) between 1 and 48
  )
);

create table if not exists public.canonical_wines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  winery text not null,
  region text,
  grapes text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.hang_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  wine_id uuid not null references public.canonical_wines (id) on delete restrict,
  image_url text not null,
  rating integer not null,
  review_text text,
  created_at timestamptz not null default now(),
  constraint hang_tickets_rating_range check (rating between 1 and 5)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists hang_tickets_created_at_idx
  on public.hang_tickets (created_at desc);

create index if not exists hang_tickets_user_id_idx
  on public.hang_tickets (user_id);

create index if not exists hang_tickets_wine_id_idx
  on public.hang_tickets (wine_id);

create index if not exists follows_following_id_idx
  on public.follows (following_id);

create index if not exists canonical_wines_name_winery_idx
  on public.canonical_wines (name, winery);

-- ---------------------------------------------------------------------------
-- Auto-create a profile when a user signs up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  nick text := left(nullif(trim(coalesce(
    meta ->> 'display_name',
    meta ->> 'full_name',
    meta ->> 'name',
    ''
  )), ''), 48);
  picture text := nullif(trim(coalesce(
    meta ->> 'avatar_url',
    meta ->> 'picture',
    ''
  )), '');
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(meta ->> 'username', ''),
      'user_' || left(new.id::text, 8)
    ),
    nick,
    picture
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Public reads, authenticated inserts. Owners can update/delete their rows.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.canonical_wines enable row level security;
alter table public.hang_tickets enable row level security;
alter table public.follows enable row level security;

-- profiles
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_insert_authenticated"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- canonical_wines
create policy "canonical_wines_select_public"
  on public.canonical_wines for select
  using (true);

create policy "canonical_wines_insert_authenticated"
  on public.canonical_wines for insert
  to authenticated
  with check (true);

-- hang_tickets
create policy "hang_tickets_select_public"
  on public.hang_tickets for select
  using (true);

create policy "hang_tickets_insert_authenticated"
  on public.hang_tickets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "hang_tickets_update_own"
  on public.hang_tickets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "hang_tickets_delete_own"
  on public.hang_tickets for delete
  to authenticated
  using (auth.uid() = user_id);

-- follows
create policy "follows_select_public"
  on public.follows for select
  using (true);

create policy "follows_insert_authenticated"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

-- Personalized feed ranking lives in the app (lib/feed-rank.ts):
-- 55% followed authors, 30% taste overlap from bottles rated 4–5,
-- 15% recency decay. No RPC or embeddings are required for this slice.
