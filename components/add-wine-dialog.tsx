"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { revalidateWines } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import type { CanonicalWine } from "@/lib/tickets";

export function AddWineDialog({
  open,
  onOpenChange,
  initialName,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  onCreated: (wine: CanonicalWine) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <AddWineForm
          initialName={initialName}
          onOpenChange={onOpenChange}
          onCreated={onCreated}
        />
      ) : null}
    </Dialog>
  );
}

function AddWineForm({
  initialName,
  onOpenChange,
  onCreated,
}: {
  initialName: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (wine: CanonicalWine) => void;
}) {
  const [name, setName] = useState(initialName);
  const [winery, setWinery] = useState("");
  const [region, setRegion] = useState("");
  const [grapes, setGrapes] = useState("");
  const [color, setColor] = useState<"red" | "white" | "rose" | "orange" | "">("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onCreate() {
    setError(null);
    if (name.trim().length < 2 || winery.trim().length < 2) {
      setError("Name and winery are required.");
      return;
    }

    setPending(true);
    try {
      const payload = {
        name: name.trim(),
        winery: winery.trim(),
        region: region.trim() || null,
        grapes: grapes.trim() || null,
        color: color || null,
      };
      const supabase = createClient();
      let { data, error: insertError } = await supabase
        .from("canonical_wines")
        .insert(payload)
        .select("id, name, winery, region, grapes, color")
        .single();

      if (insertError && /color|schema cache|does not exist/i.test(insertError.message)) {
        const retry = await supabase
          .from("canonical_wines")
          .insert({
            name: payload.name,
            winery: payload.winery,
            region: payload.region,
            grapes: payload.grapes,
          })
          .select("id, name, winery, region, grapes")
          .single();
        data = retry.data ? { ...retry.data, color: payload.color } : retry.data;
        insertError = retry.error;
      }

      if (insertError || !data) {
        setError(insertError?.message ?? "Could not add that wine.");
        return;
      }

      revalidateWines();
      onCreated(data);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add that wine.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DialogContent className="max-h-[85dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add a wine</DialogTitle>
        <DialogDescription>
          This becomes part of the shared cellar other tickets can attach to.
        </DialogDescription>
      </DialogHeader>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Name</span>
        <Input
          className="h-11 bg-card px-3"
          value={name}
          placeholder="2018 Cannubi Barolo"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Winery</span>
        <Input
          className="h-11 bg-card px-3"
          value={winery}
          placeholder="Luciano Sandrone"
          onChange={(event) => setWinery(event.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Region</span>
        <Input
          className="h-11 bg-card px-3"
          value={region}
          placeholder="Piedmont, Italy"
          onChange={(event) => setRegion(event.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Grapes</span>
        <Input
          className="h-11 bg-card px-3"
          value={grapes}
          placeholder="Nebbiolo"
          onChange={(event) => setGrapes(event.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Color</span>
        <select
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
          value={color}
          onChange={(event) =>
            setColor(event.target.value as typeof color)
          }
        >
          <option value="">Not sure</option>
          <option value="red">Red</option>
          <option value="white">White</option>
          <option value="rose">Rosé</option>
          <option value="orange">Orange</option>
        </select>
      </label>

      {error ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" disabled={pending} onClick={() => void onCreate()}>
          {pending ? "Adding…" : "Add wine"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
