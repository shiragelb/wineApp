-- Seed renowned wineries + common grape varietals for Hang Tickets autocomplete.
-- Safe to re-run. Run after wine_metadata_wineries_grapes migration.

insert into public.grape_varietals (name)
select v.name
from (
  values
    ('Nebbiolo'),
    ('Sangiovese'),
    ('Cabernet Sauvignon'),
    ('Cabernet Franc'),
    ('Merlot'),
    ('Pinot Noir'),
    ('Pinot Gris'),
    ('Pinot Grigio'),
    ('Pinot Blanc'),
    ('Chardonnay'),
    ('Sauvignon Blanc'),
    ('Riesling'),
    ('Syrah'),
    ('Shiraz'),
    ('Grenache'),
    ('Garnacha'),
    ('Mourvèdre'),
    ('Cinsault'),
    ('Carignan'),
    ('Tempranillo'),
    ('Malbec'),
    ('Zinfandel'),
    ('Petite Sirah'),
    ('Barbera'),
    ('Dolcetto'),
    ('Gamay'),
    ('Aglianico'),
    ('Nerello Mascalese'),
    ('Montepulciano'),
    ('Primitivo'),
    ('Corvina'),
    ('Traminer'),
    ('Gewürztraminer'),
    ('Grüner Veltliner'),
    ('Chenin Blanc'),
    ('Viognier'),
    ('Semillon'),
    ('Albariño'),
    ('Vermentino'),
    ('Trebbiano'),
    ('Cortese'),
    ('Assyrtiko'),
    ('Furmint'),
    ('Blaufränkisch'),
    ('Zweigelt'),
    ('St. Laurent'),
    ('Welschriesling'),
    ('Muscat'),
    ('Pedro Ximénez'),
    ('Palomino'),
    ('Touriga Nacional'),
    ('Field Blend')
) as v(name)
where not exists (
  select 1 from public.grape_varietals g where lower(g.name) = lower(v.name)
);

insert into public.wineries (name, country, country_code, region)
select v.name, v.country, v.country_code, v.region
from (
  values
    ('Judith Beck', 'Austria', 'AT', 'Burgenland'),
    ('Gut Oggau', 'Austria', 'AT', 'Burgenland'),
    ('Claus Preisinger', 'Austria', 'AT', 'Burgenland'),
    ('Meinklang', 'Austria', 'AT', 'Burgenland'),
    ('Moric', 'Austria', 'AT', 'Burgenland'),
    ('Weninger', 'Austria', 'AT', 'Burgenland'),
    ('Nikolaihof', 'Austria', 'AT', 'Wachau'),
    ('F.X. Pichler', 'Austria', 'AT', 'Wachau'),
    ('Luciano Sandrone', 'Italy', 'IT', 'Piedmont'),
    ('Giuseppe Rinaldi', 'Italy', 'IT', 'Piedmont'),
    ('Bartolo Mascarello', 'Italy', 'IT', 'Piedmont'),
    ('Gaja', 'Italy', 'IT', 'Piedmont'),
    ('Vietti', 'Italy', 'IT', 'Piedmont'),
    ('Antinori', 'Italy', 'IT', 'Tuscany'),
    ('Biondi-Santi', 'Italy', 'IT', 'Tuscany'),
    ('Fontodi', 'Italy', 'IT', 'Tuscany'),
    ('Quintarelli', 'Italy', 'IT', 'Veneto'),
    ('Frank Cornelissen', 'Italy', 'IT', 'Sicily'),
    ('Arianna Occhipinti', 'Italy', 'IT', 'Sicily'),
    ('Domaine de la Romanée-Conti', 'France', 'FR', 'Burgundy'),
    ('Domaine Dujac', 'France', 'FR', 'Burgundy'),
    ('Domaine Leflaive', 'France', 'FR', 'Burgundy'),
    ('William Fèvre', 'France', 'FR', 'Burgundy'),
    ('Domaine Tempier', 'France', 'FR', 'Provence'),
    ('Château Rayas', 'France', 'FR', 'Rhône'),
    ('Domaine Jamet', 'France', 'FR', 'Rhône'),
    ('Pascal Cotat', 'France', 'FR', 'Loire'),
    ('Clos Rougeard', 'France', 'FR', 'Loire'),
    ('Domaine Ostertag', 'France', 'FR', 'Alsace'),
    ('Château d’Aqueria', 'France', 'FR', 'Rhône'),
    ('Ridge Vineyards', 'United States', 'US', 'California'),
    ('Sine Qua Non', 'United States', 'US', 'California'),
    ('Littorai', 'United States', 'US', 'California'),
    ('Catena Zapata', 'Argentina', 'AR', 'Mendoza'),
    ('Zuccardi', 'Argentina', 'AR', 'Mendoza'),
    ('Golan Heights Winery', 'Israel', 'IL', 'Golan Heights'),
    ('Recanati', 'Israel', 'IL', 'Galilee'),
    ('Joh. Jos. Prüm', 'Germany', 'DE', 'Mosel'),
    ('Egon Müller', 'Germany', 'DE', 'Mosel'),
    ('Weingut Keller', 'Germany', 'DE', 'Rheinhessen'),
    ('Pingus', 'Spain', 'ES', 'Ribera del Duero'),
    ('Lopez de Heredia', 'Spain', 'ES', 'Rioja'),
    ('Comando G', 'Spain', 'ES', 'Sierra de Gredos'),
    ('Niepoort', 'Portugal', 'PT', 'Douro'),
    ('Quinta do Noval', 'Portugal', 'PT', 'Douro'),
    ('Radikon', 'Italy', 'IT', 'Friuli'),
    ('Josko Gravner', 'Italy', 'IT', 'Friuli'),
    ('Tablas Creek', 'United States', 'US', 'California'),
    ('Henschke', 'Australia', 'AU', 'Eden Valley'),
    ('Penfolds', 'Australia', 'AU', 'South Australia'),
    ('Château Musar', 'Lebanon', 'LB', 'Bekaa Valley'),
    ('Alheit Vineyards', 'South Africa', 'ZA', 'Western Cape'),
    ('Sadie Family', 'South Africa', 'ZA', 'Swartland')
) as v(name, country, country_code, region)
where not exists (
  select 1 from public.wineries w where lower(w.name) = lower(v.name)
);

select public.link_wines_to_wineries();

update public.canonical_wines
set
  wine_type = coalesce(wine_type, 'red'),
  grapes = coalesce(grapes, '[{"grape":"Nebbiolo","percentage":100}]'::jsonb),
  color = coalesce(color, 'red')
where id = '00000000-0000-4000-8000-000000000001';

update public.canonical_wines
set
  wine_type = coalesce(wine_type, 'rosé'),
  grapes = coalesce(
    grapes,
    '[{"grape":"Mourvèdre","percentage":50},{"grape":"Grenache","percentage":30},{"grape":"Cinsault","percentage":20}]'::jsonb
  ),
  color = coalesce(color, 'rose')
where id = '00000000-0000-4000-8000-000000000002';

update public.canonical_wines
set
  wine_type = coalesce(wine_type, 'red'),
  grapes = coalesce(
    grapes,
    '[{"grape":"Zinfandel","percentage":70},{"grape":"Petite Sirah","percentage":20},{"grape":"Carignan","percentage":10}]'::jsonb
  ),
  color = coalesce(color, 'red')
where id = '00000000-0000-4000-8000-000000000003';

update public.canonical_wines
set
  wine_type = coalesce(wine_type, 'white'),
  grapes = coalesce(grapes, '[{"grape":"Chardonnay","percentage":100}]'::jsonb),
  color = coalesce(color, 'white')
where id = '00000000-0000-4000-8000-000000000004';

update public.canonical_wines
set
  wine_type = coalesce(wine_type, 'white'),
  grapes = coalesce(grapes, '[{"grape":"Riesling","percentage":100}]'::jsonb),
  color = coalesce(color, 'white')
where id = '00000000-0000-4000-8000-000000000005';

update public.canonical_wines
set
  wine_type = coalesce(wine_type, 'orange'),
  grapes = coalesce(grapes, '[{"grape":"Pinot Gris","percentage":100}]'::jsonb),
  color = coalesce(color, 'orange')
where id = '00000000-0000-4000-8000-000000000006';

update public.canonical_wines
set
  wine_type = coalesce(wine_type, 'white'),
  grapes = coalesce(grapes, '[{"grape":"Sauvignon Blanc","percentage":100}]'::jsonb),
  color = coalesce(color, 'white')
where id = '00000000-0000-4000-8000-000000000007';

update public.canonical_wines
set
  wine_type = coalesce(wine_type, 'rosé'),
  grapes = coalesce(grapes, '[{"grape":"Grenache","percentage":100}]'::jsonb),
  color = coalesce(color, 'rose')
where id = '00000000-0000-4000-8000-000000000008';
