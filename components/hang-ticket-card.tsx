import { Star } from "lucide-react";
import type { MockTicket } from "@/lib/mock-tickets";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={
            index < rating
              ? "size-3.5 fill-primary text-primary"
              : "size-3.5 text-border"
          }
          aria-hidden
        />
      ))}
    </div>
  );
}

export function HangTicketCard({ ticket }: { ticket: MockTicket }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_8px_24px_-18px_rgba(70,24,16,0.45)]">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
        >
          {ticket.username.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{ticket.username}</p>
          <p className="truncate text-xs text-muted-foreground">{ticket.region}</p>
        </div>
      </div>

      <div
        className="relative aspect-[4/5] w-full"
        style={{ background: ticket.tone }}
        role="img"
        aria-label={`Placeholder photo for ${ticket.wine}`}
      >
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/45 to-transparent px-4 pt-16 pb-4 text-white">
          <p className="font-heading text-2xl leading-tight">{ticket.wine}</p>
          <p className="mt-0.5 text-sm text-white/85">{ticket.winery}</p>
        </div>
      </div>

      <div className="space-y-2 px-4 py-3.5">
        <Stars rating={ticket.rating} />
        <p className="text-sm leading-relaxed text-foreground/90">{ticket.review}</p>
      </div>
    </article>
  );
}
