"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { GrapeBlendBar } from "@/components/grape-blend-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  COMMON_GRAPES,
  grapeBlendTotal,
  type GrapeShare,
} from "@/lib/wine-meta";
import { searchGrapeVarietals } from "@/lib/wineries";
import { cn } from "@/lib/utils";

type Mode = "single" | "blend";

export function GrapeBlendSelector({
  value,
  onChange,
}: {
  value: GrapeShare[];
  onChange: (next: GrapeShare[]) => void;
}) {
  const [mode, setMode] = useState<Mode>(
    value.length > 1 || value.some((share) => share.percentage != null && share.percentage < 100)
      ? "blend"
      : "single"
  );
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([...COMMON_GRAPES]);
  const [fieldBlend, setFieldBlend] = useState(
    value.length === 1 && /field blend/i.test(value[0]?.grape ?? "")
  );

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const remote = await searchGrapeVarietals(query, 16);
          if (cancelled) return;
          const merged = [
            ...remote,
            ...COMMON_GRAPES.filter(
              (grape) =>
                !remote.some((item) => item.toLowerCase() === grape.toLowerCase()) &&
                grape.toLowerCase().includes(query.trim().toLowerCase())
            ),
          ];
          setSuggestions(merged.slice(0, 16));
        } catch {
          if (!cancelled) {
            setSuggestions(
              COMMON_GRAPES.filter((grape) =>
                grape.toLowerCase().includes(query.trim().toLowerCase())
              ).slice(0, 16)
            );
          }
        }
      })();
    }, 160);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const total = grapeBlendTotal(value);
  const totalOk = fieldBlend || mode === "single" || total === 100;

  function setSingle(grape: string) {
    setFieldBlend(false);
    onChange([{ grape, percentage: 100 }]);
  }

  function addGrape(grape: string) {
    if (value.some((share) => share.grape.toLowerCase() === grape.toLowerCase())) return;
    const remaining = Math.max(0, 100 - total);
    onChange([...value, { grape, percentage: remaining || null }]);
    setQuery("");
  }

  function updatePercent(index: number, percentage: number) {
    onChange(
      value.map((share, i) =>
        i === index
          ? { ...share, percentage: Math.max(0, Math.min(100, Math.round(percentage))) }
          : share
      )
    );
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const filtered = useMemo(
    () =>
      suggestions.filter(
        (grape) => !value.some((share) => share.grape.toLowerCase() === grape.toLowerCase())
      ),
    [suggestions, value]
  );

  return (
    <div className="space-y-3">
      <div className="flex rounded-full border border-border bg-card p-1">
        <button
          type="button"
          className={cn(
            "flex-1 rounded-full py-1.5 text-xs font-medium",
            mode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
          onClick={() => {
            setMode("single");
            setFieldBlend(false);
            if (value[0]) onChange([{ grape: value[0].grape, percentage: 100 }]);
          }}
        >
          Single varietal
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 rounded-full py-1.5 text-xs font-medium",
            mode === "blend" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
          onClick={() => setMode("blend")}
        >
          Blend
        </button>
      </div>

      {mode === "single" ? (
        <div className="space-y-2">
          <Input
            className="h-11 bg-card px-3"
            value={query || value[0]?.grape || ""}
            placeholder="Search grapes — Nebbiolo, Traminer…"
            onChange={(event) => {
              setQuery(event.target.value);
              if (value[0]) onChange([{ grape: event.target.value, percentage: 100 }]);
            }}
          />
          <div className="flex max-h-36 flex-wrap gap-1.5 overflow-auto">
            {filtered.slice(0, 12).map((grape) => (
              <button
                key={grape}
                type="button"
                className={cn(
                  "rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium",
                  value[0]?.grape === grape && "border-primary bg-primary/10 text-primary"
                )}
                onClick={() => {
                  setQuery(grape);
                  setSingle(grape);
                }}
              >
                {grape}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fieldBlend}
              onChange={(event) => {
                const checked = event.target.checked;
                setFieldBlend(checked);
                if (checked) {
                  onChange([{ grape: "Field Blend", percentage: null }]);
                } else if (value.length === 0) {
                  onChange([]);
                }
              }}
            />
            <span>Local / Field Blend (unknown %)</span>
          </label>

          {!fieldBlend ? (
            <>
              <div className="flex gap-2">
                <Input
                  className="h-11 bg-card px-3"
                  value={query}
                  placeholder="Add a grape"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && query.trim()) {
                      event.preventDefault();
                      addGrape(query.trim());
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0"
                  onClick={() => query.trim() && addGrape(query.trim())}
                >
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>
              <div className="flex max-h-28 flex-wrap gap-1.5 overflow-auto">
                {filtered.slice(0, 10).map((grape) => (
                  <button
                    key={grape}
                    type="button"
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium"
                    onClick={() => addGrape(grape)}
                  >
                    {grape}
                  </button>
                ))}
              </div>
              <ul className="space-y-2">
                {value.map((share, index) => (
                  <li
                    key={`${share.grape}-${index}`}
                    className="rounded-xl border border-border bg-card px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{share.grape}</p>
                      <button
                        type="button"
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                        onClick={() => removeAt(index)}
                        aria-label={`Remove ${share.grape}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={share.percentage ?? 0}
                        className="w-full accent-[var(--primary)]"
                        onChange={(event) => updatePercent(index, Number(event.target.value))}
                      />
                      <Input
                        className="h-9 w-16 bg-background px-2 text-center"
                        inputMode="numeric"
                        value={share.percentage ?? ""}
                        onChange={(event) =>
                          updatePercent(index, Number(event.target.value || 0))
                        }
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </li>
                ))}
              </ul>
              {value.length > 0 ? <GrapeBlendBar shares={value} /> : null}
              <p
                className={cn(
                  "text-xs",
                  totalOk ? "text-muted-foreground" : "text-destructive"
                )}
              >
                Blend total: {total}%{totalOk ? "" : " — needs to equal 100%"}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Saved as a field blend without percentages — useful for co-ferments and old vines.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
