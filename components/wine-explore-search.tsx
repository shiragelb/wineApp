"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useWineSearch } from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { winePath } from "@/lib/tickets";

export function WineExploreSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const configured = isSupabaseConfigured();
  const { data: results, isLoading } = useWineSearch(configured ? debounced : "");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  if (!configured) return null;

  const showList = open && query.trim().length > 0;

  return (
    <div className="relative mt-3">
      <label className="relative block">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="h-11 bg-card pr-3 pl-9"
          value={query}
          placeholder="Search a bottle before you buy…"
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
        />
      </label>
      {showList ? (
        <ul className="absolute inset-x-0 z-50 mt-1 max-h-64 overflow-auto rounded-xl border border-border bg-card shadow-lg">
          {(results ?? []).map((wine) => (
            <li key={wine.id}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                  router.push(winePath(wine.id));
                }}
              >
                <span className="block text-sm font-medium">{wine.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {wine.winery}
                  {wine.region ? ` · ${wine.region}` : ""}
                </span>
              </button>
            </li>
          ))}
          {isLoading ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">Searching…</li>
          ) : null}
          {!isLoading && (results?.length ?? 0) === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">
              No wines match that search.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
