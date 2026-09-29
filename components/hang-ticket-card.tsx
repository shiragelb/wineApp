"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { FollowButton } from "@/components/follow-button";
import { TicketOwnerMenu } from "@/components/ticket-owner-menu";
import { profileInitials } from "@/lib/profile";
import { profilePath, winePath, type HangTicketView } from "@/lib/tickets";

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

export function HangTicketCard({
  ticket,
  priority = false,
}: {
  ticket: HangTicketView;
  priority?: boolean;
}) {
  const initials = profileInitials({
    username: ticket.username,
    display_name: ticket.displayName === `@${ticket.username}` ? null : ticket.displayName,
  });
  const canOpenProfile = Boolean(ticket.username && ticket.username !== "guest");
  const profileHref = canOpenProfile ? profilePath(ticket.username) : null;
  const wineHref = ticket.wineId ? winePath(ticket.wineId) : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_8px_24px_-18px_rgba(70,24,16,0.45)]">
      <div className="flex items-center gap-2 px-4 py-3">
        {profileHref ? (
          <Link
            href={profileHref}
            prefetch={true}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg -mx-1 px-1 py-0.5 hover:bg-muted/70"
          >
            <span className="relative flex size-8 shrink-0 overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {ticket.avatarUrl ? (
                <Image
                  src={ticket.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center">{initials}</span>
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{ticket.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {ticket.handle ?? ticket.region}
                {ticket.handle && ticket.region ? ` · ${ticket.region}` : ""}
              </p>
            </div>
          </Link>
        ) : (
          <>
            <span className="relative flex size-8 shrink-0 overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
              <span className="flex size-full items-center justify-center">{initials}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{ticket.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {ticket.handle ?? ticket.region}
                {ticket.handle && ticket.region ? ` · ${ticket.region}` : ""}
              </p>
            </div>
          </>
        )}
        <TicketOwnerMenu ticket={ticket} />
        <FollowButton profileId={ticket.userId} />
      </div>

      <div
        className="relative aspect-[4/5] w-full"
        style={ticket.imageUrl ? undefined : { background: ticket.tone }}
        role={ticket.imageUrl ? undefined : "img"}
        aria-label={
          ticket.imageUrl ? undefined : `Placeholder photo for ${ticket.wine}`
        }
      >
        {ticket.imageUrl ? (
          <Image
            src={ticket.imageUrl}
            alt={ticket.wine}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            priority={priority}
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent px-4 pt-16 pb-4 text-white">
          {wineHref ? (
            <Link href={wineHref} prefetch={true} className="block hover:opacity-90">
              <p className="text-2xl font-semibold leading-tight tracking-tight underline-offset-4 hover:underline">
                {ticket.wine}
              </p>
              <p className="mt-0.5 text-sm text-white/85">{ticket.winery}</p>
            </Link>
          ) : (
            <>
              <p className="text-2xl font-semibold leading-tight tracking-tight">{ticket.wine}</p>
              <p className="mt-0.5 text-sm text-white/85">{ticket.winery}</p>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2 px-4 py-3.5">
        <Stars rating={ticket.rating} />
        {ticket.review ? (
          <p className="text-sm leading-relaxed text-foreground/90">{ticket.review}</p>
        ) : null}
      </div>
    </article>
  );
}
