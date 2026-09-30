-- Hang Tickets — structured wine metadata (wineries, wine_type, grapes JSONB)
-- Safe to re-run. Apply in the Supabase SQL Editor or via migration tooling.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Reference: grape varietals (autocomplete)
-- ---------------------------------------------------------------------------

create table if not exists public.grape_varietals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint grape_varietals_name_length check (char_length(name) between 2 and 64)
);

create unique index if not exists grape_varietals_name_ci_idx
  on public.grape_varietals (lower(name));

create index if not exists grape_varietals_name_trgm_idx
  on public.grape_varietals using gin (name gin_trgm_ops);

alter table public.grape_varietals enable row level security;

drop policy if exists "grape_varietals_select_public" on public.grape_varietals;
create policy "grape_varietals_select_public"
  on public.grape_varietals for select
  using (true);

drop policy if exists "grape_varietals_insert_authenticated" on public.grape_varietals;
create policy "grape_varietals_insert_authenticated"
  on public.grape_varietals for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- Wineries
-- ---------------------------------------------------------------------------

create table if not exists public.wineries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  country_code text,
  region text,
  created_at timestamptz not null default now(),
  constraint wineries_name_length check (char_length(name) between 2 and 120),
  constraint wineries_country_code_len check (
    country_code is null or char_length(country_code) = 2
  )
);

create unique index if not exists wineries_name_ci_idx
  on public.wineries (lower(name));

create index if not exists wineries_name_trgm_idx
  on public.wineries using gin (name gin_trgm_ops);

create index if not exists wineries_region_trgm_idx
  on public.wineries using gin (region gin_trgm_ops);

create index if not exists wineries_country_idx
  on public.wineries (country_code);

alter table public.wineries enable row level security;

drop policy if exists "wineries_select_public" on public.wineries;
create policy "wineries_select_public"
  on public.wineries for select
  using (true);

drop policy if exists "wineries_insert_authenticated" on public.wineries;
create policy "wineries_insert_authenticated"
  on public.wineries for insert
  to authenticated
  with check (true);

drop policy if exists "wineries_update_authenticated" on public.wineries;
create policy "wineries_update_authenticated"
  on public.wineries for update
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- canonical_wines: winery_id, wine_type, grapes as JSONB
-- ---------------------------------------------------------------------------

alter table public.canonical_wines
  add column if not exists winery_id uuid references public.wineries (id) on delete set null;

alter table public.canonical_wines
  add column if not exists wine_type text;

alter table public.canonical_wines
  add column if not exists color text;

-- Move legacy text grapes aside, then recreate grapes as jsonb.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_wines'
      and column_name = 'grapes'
      and udt_name in ('text', 'varchar', 'bpchar')
  ) then
    alter table public.canonical_wines rename column grapes to grapes_legacy;
  end if;
end
$$;

alter table public.canonical_wines
  add column if not exists grapes jsonb;

-- Convert legacy comma-separated grapes into structured JSONB.
update public.canonical_wines
set grapes = (
  select jsonb_agg(
    jsonb_build_object('grape', trim(part), 'percentage', null)
    order by ordinality
  )
  from unnest(string_to_array(grapes_legacy, ',')) with ordinality as u(part, ordinality)
  where nullif(trim(part), '') is not null
)
where grapes is null
  and grapes_legacy is not null
  and nullif(btrim(grapes_legacy), '') is not null;

-- Single-varietal rows get 100%.
update public.canonical_wines
set grapes = jsonb_build_array(
  jsonb_build_object('grape', grapes -> 0 ->> 'grape', 'percentage', 100)
)
where grapes is not null
  and jsonb_typeof(grapes) = 'array'
  and jsonb_array_length(grapes) = 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'canonical_wines_wine_type_check'
  ) then
    alter table public.canonical_wines
      add constraint canonical_wines_wine_type_check
      check (
        wine_type is null
        or wine_type in (
          'red', 'white', 'rosé', 'sparkling', 'orange', 'fortified', 'dessert'
        )
      );
  end if;
end
$$;

update public.canonical_wines
set wine_type = case
  when color = 'rose' then 'rosé'
  when color in ('red', 'white', 'orange') then color
  else wine_type
end
where wine_type is null and color is not null;

update public.canonical_wines
set color = case
  when wine_type = 'rosé' then 'rose'
  when wine_type in ('red', 'white', 'orange') then wine_type
  when wine_type = 'sparkling' then coalesce(color, 'white')
  when wine_type in ('fortified', 'dessert') then coalesce(color, 'red')
  else color
end
where wine_type is not null;

create index if not exists canonical_wines_winery_id_idx
  on public.canonical_wines (winery_id);

create index if not exists canonical_wines_wine_type_idx
  on public.canonical_wines (wine_type);

create index if not exists canonical_wines_grapes_gin_idx
  on public.canonical_wines using gin (grapes jsonb_path_ops);

create index if not exists canonical_wines_name_trgm_idx
  on public.canonical_wines using gin (name gin_trgm_ops);

create index if not exists canonical_wines_winery_trgm_idx
  on public.canonical_wines using gin (winery gin_trgm_ops);

create or replace function public.sync_wine_winery_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.wineries%rowtype;
begin
  if new.winery_id is null then
    return new;
  end if;

  select * into w from public.wineries where id = new.winery_id;
  if not found then
    return new;
  end if;

  new.winery := w.name;
  if new.region is null or btrim(new.region) = '' then
    new.region := nullif(
      concat_ws(', ', nullif(w.region, ''), nullif(w.country, '')),
      ''
    );
  end if;
  return new;
end;
$$;

drop trigger if exists sync_wine_winery_fields_trg on public.canonical_wines;
create trigger sync_wine_winery_fields_trg
  before insert or update of winery_id on public.canonical_wines
  for each row execute function public.sync_wine_winery_fields();

create or replace function public.link_wines_to_wineries()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.canonical_wines cw
  set winery_id = w.id
  from public.wineries w
  where cw.winery_id is null
    and lower(cw.winery) = lower(w.name);
end;
$$;
