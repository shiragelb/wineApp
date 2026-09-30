import { createClient } from "@/lib/supabase/client";
import {
  grapesToLegacyText,
  parseGrapeShares,
  wineTypeToBrowseColor,
  type GrapeShare,
  type WineType,
  type WineryRow,
} from "@/lib/wine-meta";
import type { CanonicalWine } from "@/lib/tickets";

export type WineSearchHit =
  | { kind: "wine"; wine: CanonicalWine }
  | { kind: "winery"; winery: WineryRow };

function sanitize(query: string) {
  return query
    .replace(/[^a-zA-Z0-9\s.'’&-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isMissingRelation(message: string) {
  return (
    /schema cache|does not exist|could not find/i.test(message) ||
    message.includes("winery_id") ||
    message.includes("wine_type") ||
    message.includes("wineries") ||
    message.includes("grape_varietals")
  );
}

function mapWineRow(row: Record<string, unknown>): CanonicalWine {
  const nested = row.wineries;
  const wineryRow = Array.isArray(nested)
    ? (nested[0] as WineryRow | undefined)
    : (nested as WineryRow | null | undefined);
  const grapes = parseGrapeShares(row.grapes);
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    winery: String(row.winery ?? wineryRow?.name ?? ""),
    region: (row.region as string | null) ?? wineryRow?.region ?? null,
    grapes: grapes.length ? grapes : (row.grapes as CanonicalWine["grapes"]),
    color: (row.color as string | null) ?? null,
    wine_type: (row.wine_type as string | null) ?? null,
    winery_id: (row.winery_id as string | null) ?? wineryRow?.id ?? null,
    country: wineryRow?.country ?? null,
    country_code: wineryRow?.country_code ?? null,
    winery_region: wineryRow?.region ?? null,
  };
}

const WINE_SELECT_RICH =
  "id, name, winery, region, grapes, color, wine_type, winery_id, wineries ( id, name, country, country_code, region )";
const WINE_SELECT_MID = "id, name, winery, region, grapes, color, wine_type, winery_id";
const WINE_SELECT_BASIC = "id, name, winery, region, grapes, color";
const WINE_SELECT_LEGACY = "id, name, winery, region, grapes";

export async function searchWineries(query: string, limit = 8): Promise<WineryRow[]> {
  const trimmed = sanitize(query);
  if (!trimmed) return [];
  const supabase = createClient();
  const pattern = `%${trimmed}%`;
  const { data, error } = await supabase
    .from("wineries")
    .select("id, name, country, country_code, region")
    .or(`name.ilike.${pattern},region.ilike.${pattern},country.ilike.${pattern}`)
    .order("name")
    .limit(limit);

  if (error) {
    if (isMissingRelation(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as WineryRow[];
}

export async function searchWineCatalog(
  query: string,
  limit = 10
): Promise<CanonicalWine[]> {
  const supabase = createClient();
  const trimmed = sanitize(query);

  async function run(select: string) {
    let request = supabase.from("canonical_wines").select(select).order("name").limit(limit);
    if (trimmed) {
      const pattern = `%${trimmed}%`;
      request = request.or(
        `name.ilike.${pattern},winery.ilike.${pattern},region.ilike.${pattern}`
      );
    }
    return request;
  }

  for (const select of [WINE_SELECT_RICH, WINE_SELECT_MID, WINE_SELECT_BASIC, WINE_SELECT_LEGACY]) {
    const result = await run(select);
    if (!result.error) {
      return ((result.data ?? []) as unknown as Record<string, unknown>[]).map(mapWineRow);
    }
    if (!isMissingRelation(result.error.message) && !/column/i.test(result.error.message)) {
      throw new Error(result.error.message);
    }
  }
  return [];
}

export async function searchWineAndWinery(query: string): Promise<WineSearchHit[]> {
  const [wines, wineries] = await Promise.all([
    searchWineCatalog(query, 8),
    searchWineries(query, 6),
  ]);

  const wineWineryIds = new Set(
    wines.map((wine) => wine.winery_id).filter(Boolean) as string[]
  );
  const wineWineryNames = new Set(wines.map((wine) => wine.winery.toLowerCase()));

  const hits: WineSearchHit[] = [
    ...wines.map((wine) => ({ kind: "wine" as const, wine })),
    ...wineries
      .filter(
        (winery) =>
          !wineWineryIds.has(winery.id) &&
          !wineWineryNames.has(winery.name.toLowerCase())
      )
      .map((winery) => ({ kind: "winery" as const, winery })),
  ];
  return hits;
}

export async function searchGrapeVarietals(query: string, limit = 12): Promise<string[]> {
  const trimmed = sanitize(query);
  const supabase = createClient();
  let request = supabase.from("grape_varietals").select("name").order("name").limit(limit);
  if (trimmed) request = request.ilike("name", `%${trimmed}%`);
  const { data, error } = await request;
  if (error) {
    if (isMissingRelation(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => row.name as string);
}

export async function ensureWinery(input: {
  name: string;
  country?: string | null;
  countryCode?: string | null;
  region?: string | null;
  existingId?: string | null;
}): Promise<WineryRow> {
  const supabase = createClient();
  if (input.existingId) {
    const existing = await supabase
      .from("wineries")
      .select("id, name, country, country_code, region")
      .eq("id", input.existingId)
      .maybeSingle();
    if (!existing.error && existing.data) return existing.data as WineryRow;
  }

  const name = input.name.trim();
  const lookup = await supabase
    .from("wineries")
    .select("id, name, country, country_code, region")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (!lookup.error && lookup.data) return lookup.data as WineryRow;
  if (lookup.error && isMissingRelation(lookup.error.message)) {
    return {
      id: "",
      name,
      country: input.country ?? null,
      country_code: input.countryCode ?? null,
      region: input.region ?? null,
    };
  }

  const inserted = await supabase
    .from("wineries")
    .insert({
      name,
      country: input.country?.trim() || null,
      country_code: input.countryCode?.trim().toUpperCase() || null,
      region: input.region?.trim() || null,
    })
    .select("id, name, country, country_code, region")
    .single();

  if (inserted.error || !inserted.data) {
    if (inserted.error && isMissingRelation(inserted.error.message)) {
      return {
        id: "",
        name,
        country: input.country ?? null,
        country_code: input.countryCode ?? null,
        region: input.region ?? null,
      };
    }
    throw new Error(inserted.error?.message ?? "Could not save winery.");
  }
  return inserted.data as WineryRow;
}

export async function createCanonicalWine(input: {
  name: string;
  wineryName: string;
  wineryId?: string | null;
  country?: string | null;
  countryCode?: string | null;
  region?: string | null;
  wineType?: WineType | null;
  grapes?: GrapeShare[];
}): Promise<CanonicalWine> {
  const supabase = createClient();
  const winery = await ensureWinery({
    name: input.wineryName,
    country: input.country,
    countryCode: input.countryCode,
    region: input.region,
    existingId: input.wineryId,
  });

  const grapes = input.grapes?.length ? input.grapes : [];
  const wineType = input.wineType ?? null;
  const color = wineTypeToBrowseColor(wineType);
  const region =
    input.region?.trim() ||
    [winery.region, winery.country].filter(Boolean).join(", ") ||
    null;

  const richPayload = {
    name: input.name.trim(),
    winery: winery.name || input.wineryName.trim(),
    winery_id: winery.id || null,
    region,
    wine_type: wineType,
    color,
    grapes: grapes.length ? grapes : null,
  };

  let { data, error } = await supabase
    .from("canonical_wines")
    .insert(richPayload)
    .select(WINE_SELECT_RICH)
    .single();

  if (error && isMissingRelation(error.message)) {
    const mid = await supabase
      .from("canonical_wines")
      .insert({
        name: richPayload.name,
        winery: richPayload.winery,
        region: richPayload.region,
        wine_type: richPayload.wine_type,
        color: richPayload.color,
        grapes: richPayload.grapes,
        winery_id: richPayload.winery_id || undefined,
      })
      .select(WINE_SELECT_MID)
      .single();
    data = mid.data as typeof data;
    error = mid.error;
  }

  if (error && isMissingRelation(error.message)) {
    const basic = await supabase
      .from("canonical_wines")
      .insert({
        name: richPayload.name,
        winery: richPayload.winery,
        region: richPayload.region,
        grapes: grapesToLegacyText(grapes),
        color: richPayload.color,
      })
      .select(WINE_SELECT_BASIC)
      .single();
    data = basic.data as typeof data;
    error = basic.error;
  }

  if (error && isMissingRelation(error.message)) {
    const legacy = await supabase
      .from("canonical_wines")
      .insert({
        name: richPayload.name,
        winery: richPayload.winery,
        region: richPayload.region,
        grapes: grapesToLegacyText(grapes),
      })
      .select(WINE_SELECT_LEGACY)
      .single();
    data = legacy.data as typeof data;
    error = legacy.error;
  }

  if (error || !data) {
    throw new Error(error?.message ?? "Could not add that wine.");
  }

  return mapWineRow(data as unknown as Record<string, unknown>);
}
