"use client";

import { useState } from "react";
import { MoreHorizontal, Star } from "lucide-react";
import { WinePicker } from "@/components/wine-picker";
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
import { useSessionUserId } from "@/lib/hooks";
import { deleteHangTicket, updateHangTicket } from "@/lib/ticket-actions";
import type { CanonicalWine, HangTicketView } from "@/lib/tickets";

type Panel = "closed" | "options" | "edit" | "delete";

export function TicketOwnerMenu({ ticket }: { ticket: HangTicketView }) {
  const { data: viewerId } = useSessionUserId();
  const [panel, setPanel] = useState<Panel>("closed");

  if (!ticket.userId || !viewerId || ticket.userId !== viewerId) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Post options"
        onClick={() => setPanel("options")}
      >
        <MoreHorizontal />
      </Button>

      <Dialog open={panel === "options"} onOpenChange={(open) => !open && setPanel("closed")}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle>Post options</DialogTitle>
            <DialogDescription>
              Only you can change or remove this hang ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={() => setPanel("edit")}
            >
              Edit post
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11 w-full"
              onClick={() => setPanel("delete")}
            >
              Delete post
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {panel === "edit" ? (
        <EditTicketDialog
          ticket={ticket}
          onClose={() => setPanel("closed")}
          onBack={() => setPanel("options")}
        />
      ) : null}

      {panel === "delete" ? (
        <DeleteTicketDialog
          ticket={ticket}
          onClose={() => setPanel("closed")}
          onBack={() => setPanel("options")}
        />
      ) : null}
    </>
  );
}

function EditTicketDialog({
  ticket,
  onClose,
  onBack,
}: {
  ticket: HangTicketView;
  onClose: () => void;
  onBack: () => void;
}) {
  const [wine, setWine] = useState<CanonicalWine | null>(
    ticket.wineId
      ? {
          id: ticket.wineId,
          name: ticket.wine,
          winery: ticket.winery,
          region: ticket.region || null,
          grapes: ticket.grapes ?? null,
        }
      : null
  );
  const [rating, setRating] = useState(ticket.rating);
  const [review, setReview] = useState(ticket.review);
  const [price, setPrice] = useState(
    ticket.price != null && Number.isFinite(ticket.price) ? String(ticket.price) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSave() {
    setError(null);
    if (!wine) {
      setError("Pick a wine from the cellar.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Choose a rating from 1 to 5 stars.");
      return;
    }

    const spent = Number(price);
    setPending(true);
    try {
      await updateHangTicket(ticket.id, {
        wineId: wine.id,
        rating,
        review,
        price: Number.isFinite(spent) && spent > 0 ? spent : null,
      });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this ticket.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit hang ticket</DialogTitle>
          <DialogDescription>
            Change the bottle, rating, or note. The photo stays the same.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Wine</legend>
          <WinePicker wine={wine} onChange={setWine} />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Rating</legend>
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  aria-pressed={rating === value}
                  className="rounded-md p-0.5 text-primary"
                  onClick={() => setRating(value)}
                >
                  <Star
                    className={
                      value <= rating
                        ? "size-7 fill-primary text-primary"
                        : "size-7 text-border"
                    }
                  />
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Note</span>
          <textarea
            rows={4}
            maxLength={2000}
            value={review}
            onChange={(event) => setReview(event.target.value)}
            placeholder="What did it taste like?"
            className="w-full resize-none rounded-xl border border-input bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">What you paid (optional)</span>
          <Input
            className="h-11 bg-card px-3"
            inputMode="decimal"
            value={price}
            placeholder="42"
            onChange={(event) => setPrice(event.target.value)}
          />
        </label>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="button" disabled={pending} onClick={() => void onSave()}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTicketDialog({
  ticket,
  onClose,
  onBack,
}: {
  ticket: HangTicketView;
  onClose: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setError(null);
    setPending(true);
    try {
      await deleteHangTicket(ticket.id, ticket.imageUrl);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete this ticket.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete this hang ticket?</DialogTitle>
          <DialogDescription>
            {ticket.wine} will leave the feed, your cellar, and this wine’s page. You cannot undo
            this.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
            Back
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => void onDelete()}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
