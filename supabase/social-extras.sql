-- Optional extras for mute + ticket price + wine color.
-- Safe to run after schema.sql. Browse still works without it
-- (color is inferred from the wine name/grapes; mutes fall back to this device).

alter table public.canonical_wines
  add column if not exists color text;

alter table public.hang_tickets
  add column if not exists price numeric;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'canonical_wines_color_check'
  ) then
    alter table public.canonical_wines
      add constraint canonical_wines_color_check
      check (color is null or color in ('red', 'white', 'rose', 'orange'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'hang_tickets_price_positive'
  ) then
    alter table public.hang_tickets
      add constraint hang_tickets_price_positive
      check (price is null or price >= 0);
  end if;
end
$$;

create table if not exists public.mutes (
  muter_id uuid not null references public.profiles (id) on delete cascade,
  muted_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id),
  constraint mutes_not_self check (muter_id <> muted_id)
);

create index if not exists mutes_muted_id_idx on public.mutes (muted_id);

alter table public.mutes enable row level security;

drop policy if exists "mutes_select_own" on public.mutes;
create policy "mutes_select_own"
  on public.mutes for select
  to authenticated
  using (auth.uid() = muter_id);

drop policy if exists "mutes_insert_own" on public.mutes;
create policy "mutes_insert_own"
  on public.mutes for insert
  to authenticated
  with check (auth.uid() = muter_id);

drop policy if exists "mutes_delete_own" on public.mutes;
create policy "mutes_delete_own"
  on public.mutes for delete
  to authenticated
  using (auth.uid() = muter_id);
