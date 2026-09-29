"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AddWineDialog } from "@/components/add-wine-dialog";
import { Input } from "@/components/ui/input";
import { useWineSearch } from "@/lib/hooks";
import type { CanonicalWine } from "@/lib/tickets";

export function WinePicker({
  wine,
  onChange,
}: {
  wine: CanonicalWine | null;
  onChange: (wine: CanonicalWine | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const { data: results, isLoading, error } = useWineSearch(debounced);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  if (wine) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-input bg-card px-3 py-3">
          <p className="text-sm font-medium">{wine.name}</p>
          <p className="text-xs text-muted-foreground">
            {wine.winery}
            {wine.region ? ` · ${wine.region}` : ""}
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-primary"
          onClick={() => onChange(null)}
        >
          Choose a different bottle
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        className="h-11 bg-card px-3"
        value={query}
        placeholder="Search the canonical cellar…"
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
      />
      <ul className="max-h-56 overflow-auto rounded-xl border border-border bg-card">
        {(results ?? []).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="w-full px-3 py-2.5 text-left hover:bg-muted"
              onClick={() => {
                onChange(item);
                setQuery("");
              }}
            >
              <span className="block text-sm font-medium">{item.name}</span>
              <span className="block text-xs text-muted-foreground">
                {item.winery}
                {item.region ? ` · ${item.region}` : ""}
              </span>
            </button>
          </li>
        ))}
        {error ? (
          <li className="px-3 py-2.5 text-sm text-destructive">{error.message}</li>
        ) : null}
        {isLoading ? (
          <li className="px-3 py-2.5 text-sm text-muted-foreground">Searching…</li>
        ) : null}
        {!isLoading && !error && (results?.length ?? 0) === 0 ? (
          <li className="px-3 py-2.5 text-sm text-muted-foreground">
            No matching wines yet.
          </li>
        ) : null}
        <li>
          <button
            type="button"
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-muted"
            onClick={() => setOpenAdd(true)}
          >
            <Plus className="size-4" aria-hidden />
            Add a new wine
          </button>
        </li>
      </ul>
      <AddWineDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        initialName={query}
        onCreated={(created) => {
          onChange(created);
          setQuery("");
        }}
      />
    </div>
  );
}
