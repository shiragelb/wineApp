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
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("canonical_wines")
        .insert({
          name: name.trim(),
          winery: winery.trim(),
          region: region.trim() || null,
          grapes: grapes.trim() || null,
        })
        .select("id, name, winery, region, grapes")
        .single();

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
