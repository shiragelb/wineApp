"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Building2, Plus, Wine } from "lucide-react";
import { GrapeBlendSelector } from "@/components/grape-blend-selector";
import { WineAttributeTags, WineOriginHeader } from "@/components/wine-tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revalidateWines } from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { CanonicalWine } from "@/lib/tickets";
import {
  grapeBlendTotal,
  parseGrapeShares,
  WINE_TYPES,
  type GrapeShare,
  type WineType,
  type WineryRow,
} from "@/lib/wine-meta";
import {
  createCanonicalWine,
  searchWineAndWinery,
} from "@/lib/wineries";
import { cn } from "@/lib/utils";

type Draft = {
  name: string;
  wineryName: string;
  wineryId: string | null;
  country: string;
  countryCode: string;
  region: string;
  wineType: WineType | "";
  grapes: GrapeShare[];
};

const emptyDraft = (seed?: Partial<Draft>): Draft => ({
  name: seed?.name ?? "",
  wineryName: seed?.wineryName ?? "",
  wineryId: seed?.wineryId ?? null,
  country: seed?.country ?? "",
  countryCode: seed?.countryCode ?? "",
  region: seed?.region ?? "",
  wineType: seed?.wineType ?? "",
  grapes: seed?.grapes ?? [],
});

export function WineSmartPicker({
  wine,
  onChange,
}: {
  wine: CanonicalWine | null;
  onChange: (wine: CanonicalWine | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const searchKey =
    isSupabaseConfigured() && !wine && !draft
      ? ["wine-winery-search", debounced]
      : null;
  const {
    data: hits = [],
    error: searchError,
    isLoading: loading,
  } = useSWR(searchKey, () => searchWineAndWinery(debounced), {
    keepPreviousData: true,
    dedupingInterval: 8_000,
  });

  if (wine) {
    const shares = parseGrapeShares(wine.grapes);
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-input bg-card px-3 py-3">
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
        </div>
        <button
          type="button"
          className="text-xs font-medium text-primary"
          onClick={() => {
            onChange(null);
            setDraft(null);
            setQuery("");
          }}
        >
          Choose a different bottle
        </button>
      </div>
    );
  }

  if (draft) {
    const activeDraft = draft;
    const total = grapeBlendTotal(activeDraft.grapes);
    const grapesOk =
      activeDraft.grapes.length === 0 ||
      activeDraft.grapes.some((share) => share.percentage == null) ||
      total === 100;

    async function saveDraft() {
      setError(null);
      if (activeDraft.name.trim().length < 2 || activeDraft.wineryName.trim().length < 2) {
        setError("Wine name and winery are required.");
        return;
      }
      if (!grapesOk) {
        setError("Blend percentages must add up to 100%.");
        return;
      }
      setSaving(true);
      try {
        const created = await createCanonicalWine({
          name: activeDraft.name,
          wineryName: activeDraft.wineryName,
          wineryId: activeDraft.wineryId,
          country: activeDraft.country || null,
          countryCode: activeDraft.countryCode || null,
          region: activeDraft.region || null,
          wineType: activeDraft.wineType || null,
          grapes: activeDraft.grapes,
        });
        revalidateWines();
        onChange(created);
        setDraft(null);
        setQuery("");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not add that wine.");
      } finally {
        setSaving(false);
      }
    }

    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Add custom wine</p>
            <p className="text-xs text-muted-foreground">
              Winery details stay filled if you picked a known producer.
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-primary"
            onClick={() => setDraft(null)}
          >
            Back to search
          </button>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Wine name</span>
          <Input
            className="h-11 bg-background px-3"
            value={draft.name}
            placeholder="Bambule! Traminer"
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Winery</span>
          <Input
            className="h-11 bg-background px-3"
            value={draft.wineryName}
            placeholder="Judith Beck"
            onChange={(event) =>
              setDraft({ ...draft, wineryName: event.target.value, wineryId: null })
            }
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Country</span>
            <Input
              className="h-11 bg-background px-3"
              value={draft.country}
              placeholder="Austria"
              onChange={(event) => setDraft({ ...draft, country: event.target.value })}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Code</span>
            <Input
              className="h-11 bg-background px-3 uppercase"
              maxLength={2}
              value={draft.countryCode}
              placeholder="AT"
              onChange={(event) =>
                setDraft({ ...draft, countryCode: event.target.value.toUpperCase() })
              }
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Region</span>
          <Input
            className="h-11 bg-background px-3"
            value={draft.region}
            placeholder="Burgenland"
            onChange={(event) => setDraft({ ...draft, region: event.target.value })}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Wine type</legend>
          <div className="flex flex-wrap gap-1.5">
            {WINE_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium",
                  draft.wineType === type.id
                    ? type.colorClass
                    : "border border-border bg-background text-muted-foreground"
                )}
                onClick={() =>
                  setDraft({
                    ...draft,
                    wineType: draft.wineType === type.id ? "" : type.id,
                  })
                }
              >
                {type.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Grapes</legend>
          <GrapeBlendSelector
            value={draft.grapes}
            onChange={(grapes) => setDraft({ ...draft, grapes })}
          />
        </fieldset>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="button" className="h-11 w-full" disabled={saving} onClick={() => void saveDraft()}>
          {saving ? "Saving…" : "Use this wine"}
        </Button>
      </div>
    );
  }

  function startFromWinery(winery: WineryRow) {
    setDraft(
      emptyDraft({
        name: query.trim(),
        wineryName: winery.name,
        wineryId: winery.id,
        country: winery.country ?? "",
        countryCode: winery.country_code ?? "",
        region: winery.region ?? "",
      })
    );
  }

  const wineHits = hits.filter((hit) => hit.kind === "wine");
  const wineryHits = hits.filter((hit) => hit.kind === "winery");

  return (
    <div className="space-y-2">
      <Input
        className="h-11 bg-card px-3"
        value={query}
        placeholder="Search wine or winery…"
        onChange={(event) => {
          setQuery(event.target.value);
          setError(null);
        }}
        autoComplete="off"
      />
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <p className="px-3 py-2.5 text-sm text-muted-foreground">Searching…</p>
        ) : null}
        {error || searchError ? <p className="px-3 py-2.5 text-sm text-destructive">{error ?? (searchError instanceof Error ? searchError.message : "Search failed.")}</p> : null}

        {wineHits.length > 0 ? (
          <div>
            <p className="border-b border-border/70 px-3 py-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Existing wines
            </p>
            <ul>
              {wineHits.map((hit) =>
                hit.kind === "wine" ? (
                  <li key={hit.wine.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-muted"
                      onClick={() => onChange(hit.wine)}
                    >
                      <Wine className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{hit.wine.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {hit.wine.winery}
                          {hit.wine.region ? ` · ${hit.wine.region}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        ) : null}

        {wineryHits.length > 0 ? (
          <div>
            <p className="border-b border-border/70 px-3 py-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Known wineries
            </p>
            <ul>
              {wineryHits.map((hit) =>
                hit.kind === "winery" ? (
                  <li key={hit.winery.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-muted"
                      onClick={() => startFromWinery(hit.winery)}
                    >
                      <Building2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{hit.winery.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {[hit.winery.country, hit.winery.region].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </button>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        ) : null}

        {!loading && wineHits.length === 0 && wineryHits.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-muted-foreground">
            No matches yet — add a custom wine below.
          </p>
        ) : null}

        <button
          type="button"
          className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-muted"
          onClick={() =>
            setDraft(
              emptyDraft({
                name: query.trim(),
              })
            )
          }
        >
          <Plus className="size-4" aria-hidden />
          Add custom wine{query.trim() ? ` “${query.trim()}”` : ""}
        </button>
      </div>
    </div>
  );
}
