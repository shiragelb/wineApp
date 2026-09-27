-- Placeholder wine so Phase 2 uploads have a wine_id.
-- Safe to run more than once.

insert into public.canonical_wines (id, name, winery, region, grapes, description)
values (
  '00000000-0000-4000-8000-000000000001',
  '2018 Cannubi Barolo',
  'Luciano Sandrone',
  'Piedmont, Italy',
  'Nebbiolo',
  'Temporary cellar row used until wine search ships.'
)
on conflict (id) do nothing;
