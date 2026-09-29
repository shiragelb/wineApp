-- Placeholder wines so search and uploads have bottles to attach to.
-- Safe to run more than once.

insert into public.canonical_wines (id, name, winery, region, grapes, description)
values
  (
    '00000000-0000-4000-8000-000000000001',
    '2018 Cannubi Barolo',
    'Luciano Sandrone',
    'Piedmont, Italy',
    'Nebbiolo',
    'Tar, rose, and a long savory finish.'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    '2021 Bandol Rosé',
    'Domaine Tempier',
    'Provence, France',
    'Mourvèdre, Grenache, Cinsault',
    'Pale, saline Provençal rosé.'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    '2019 Lytton Springs',
    'Ridge Vineyards',
    'Dry Creek Valley, California',
    'Zinfandel, Petite Sirah, Carignane',
    'Dusty bramble and black pepper.'
  )
on conflict (id) do nothing;
