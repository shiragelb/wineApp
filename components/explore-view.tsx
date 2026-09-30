"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { WineAttributeTags, WineOriginHeader } from "@/components/wine-tags";
import { useWineCatalog } from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  explorePath,
  normalizeWineType,
  parseGrapeShares,
  wineTypeMeta,
} from "@/lib/wine-meta";
import { winePath, type CanonicalWine } from "@/lib/tickets";
import { inferWineColor } from "@/lib/wine-style";
import { cn } from "@/lib/utils";

function matchesFilter(
  wine: CanonicalWine,
  filters: {
    winery?: string | null;
    region?: string | null;
    grape?: string | null;
    type?: string | null;
  }
) {
  const shares = parseGrapeShares(wine.grapes);
  const type = normalizeWineType(wine.wine_type) ?? normalizeWineType(wine.color);
  if (filters.winery && wine.winery.toLowerCase() !== filters.winery.toLowerCase()) {
    return false;
  }
  if (filters.region) {
    const blob = `${wine.region ?? ""} ${wine.winery_region ?? ""} ${wine.country ?? ""}`.toLowerCase();
    if (!blob.includes(filters.region.toLowerCase())) return false;
  }
  if (filters.grape) {
    const ok = shares.some(
      (share) => share.grape.toLowerCase() === filters.grape!.toLowerCase()
    );
    if (!ok) return false;
  }
  if (filters.type) {
    const wanted = normalizeWineType(filters.type);
    if (wanted && type !== wanted) {
      const browse = inferWineColor(wine);
      const meta = wineTypeMeta(wanted);
      if (!meta?.browseColor || meta.browseColor !== browse) return false;
    }
  }
  return true;
}

export function ExploreView() {
  const configured = isSupabaseConfigured();
  const params = useSearchParams();
  const winery = params.get("winery");
  const region = params.get("region");
  const grape = params.get("grape");
  const type = params.get("type");
  const { data, isLoading, error } = useWineCatalog();

  const wines = useMemo(() => {
    const list = data?.wines ?? [];
    return list.filter((wine) => matchesFilter(wine, { winery, region, grape, type }));
  }, [data?.wines, winery, region, grape, type]);

  const titleBits = [type, grape, winery, region].filter(Boolean);
  const title = titleBits.length ? titleBits.join(" · ") : "Explore";

  if (!configured) {
    return (
      <>
        <PageHeader backHref="/" eyebrow="Cellar" title="Explore" />
        <SetupNeeded />
      </>
    );
  }

  return (
    <>
      <PageHeader
        backHref="/"
        eyebrow="Filtered cellar"
        title={title}
        description="Tap a tag on any bottle to land here."
      />
      <div className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap gap-1.5">
          {winery ? (
            <Link
              href={explorePath({ region, grape, type })}
              className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium"
            >
              Winery: {winery} ×
            </Link>
          ) : null}
          {region ? (
            <Link
              href={explorePath({ winery, grape, type })}
              className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium"
            >
              Region: {region} ×
            </Link>
          ) : null}
          {grape ? (
            <Link
              href={explorePath({ winery, region, type })}
              className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium"
            >
              Grape: {grape} ×
            </Link>
          ) : null}
          {type ? (
            <Link
              href={explorePath({ winery, region, grape })}
              className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium"
            >
              Type: {type} ×
            </Link>
          ) : null}
        </div>

        {isLoading && wines.length === 0 ? (
          <EmptyState title="Filtering the cellar" body="Loading matching bottles…" />
        ) : null}
        {error ? (
          <EmptyState title="Could not load wines" body={error.message} />
        ) : null}
        {!isLoading && !error && wines.length === 0 ? (
          <EmptyState
            title="Nothing in this slice"
            body="Clear a filter or hang a ticket with matching tags."
          />
        ) : null}

        <ul className="space-y-2">
          {wines.map((wine) => {
            const shares = parseGrapeShares(wine.grapes);
            return (
              <li key={wine.id}>
                <Link
                  href={winePath(wine.id)}
                  prefetch={true}
                  className={cn(
                    "block rounded-2xl border border-border/80 bg-card px-3 py-3 shadow-[0_8px_20px_-16px_rgba(70,24,16,0.45)]"
                  )}
                >
                  <p className="text-sm font-semibold tracking-tight">{wine.name}</p>
                  <WineOriginHeader
                    className="mt-1"
                    country={wine.country}
                    countryCode={wine.country_code}
                    region={wine.winery_region || wine.region}
                    winery={wine.winery}
                  />
                  <WineAttributeTags
                    className="mt-2"
                    wineType={wine.wine_type ?? wine.color}
                    grapeShares={shares}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
