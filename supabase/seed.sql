-- Placeholder wines so search, browse, and uploads have bottles to attach to.
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
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    '2022 Chablis Premier Cru',
    'William Fèvre',
    'Burgundy, France',
    'Chardonnay',
    'Oyster shell and green apple. A white for oysters.'
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    '2021 Riesling Kabinett',
    'Joh. Jos. Prüm',
    'Mosel, Germany',
    'Riesling',
    'Slate, lime, and a little residual sugar.'
  ),
  (
    '00000000-0000-4000-8000-000000000006',
    '2020 Skin Contact Pinot Gris',
    'Domaine Ostertag',
    'Alsace, France',
    'Pinot Gris',
    'Orange wine: tannin, apricot, and tea leaf.'
  ),
  (
    '00000000-0000-4000-8000-000000000007',
    '2022 Sancerre Blanc',
    'Pascal Cotat',
    'Loire, France',
    'Sauvignon Blanc',
    'Gooseberry and chalk. A white for the shop fridge.'
  ),
  (
    '00000000-0000-4000-8000-000000000008',
    '2021 Tavel Rosé',
    'Château d’Aqueria',
    'Rhône, France',
    'Grenache',
    'A darker, structured rosé.'
  )
on conflict (id) do nothing;
