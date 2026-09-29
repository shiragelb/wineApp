"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { HangTicketCard } from "@/components/hang-ticket-card";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { WineExploreSearch } from "@/components/wine-explore-search";
import { useFollowingIds, useSessionUserId, useWine, useWineTickets } from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatPrice, formatScore, wineVerdict } from "@/lib/wine-verdict";
import { cn } from "@/lib/utils";

export function WineFeedView() {
  const params = useParams<{ wineId: string }>();
  const wineId = decodeURIComponent(params.wineId ?? "");
  const configured = isSupabaseConfigured();
  const { data: viewerId } = useSessionUserId();
  const { data: followingIds } = useFollowingIds(viewerId ?? null);
  const { data: wine, error, isLoading } = useWine(configured && wineId ? wineId : null);
  const { data: tickets, isLoading: ticketsLoading } = useWineTickets(
    configured && wineId ? wineId : null
  );
  const [scope, setScope] = useState<"friends" | "everyone">("everyone");

  const list = tickets ?? [];
  const friends = useMemo(() => new Set(followingIds ?? []), [followingIds]);
  const friendList = list.filter((ticket) => ticket.userId && friends.has(ticket.userId));
  const shown = scope === "friends" ? friendList : list;
  const verdict = wine ? wineVerdict(wine.id, list, friends) : null;

  if (!configured) {
    return (
      <>
        <PageHeader backHref="/" eyebrow="Cellar" title="Wine" />
        <SetupNeeded />
      </>
    );
  }

  if (isLoading && !wine) {
    return (
      <>
        <PageHeader backHref="/" eyebrow="Cellar" title="Wine" />
        <div className="px-4 py-5">
          <EmptyState title="Opening the bottle" body="Loading pours for this wine…" />
        </div>
      </>
    );
  }

  if (error || !wine) {
    return (
      <>
        <PageHeader backHref="/" eyebrow="Cellar" title="Not found" />
        <div className="px-4 py-5">
          <EmptyState
            title="That wine is not in the cellar"
            body="Search again from the cellar, or hang a ticket with a new bottle."
          />
        </div>
      </>
    );
  }

  const subtitle = [wine.winery, wine.region, wine.grapes].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader
        backHref="/"
        eyebrow="What people thought"
        title={wine.name}
        description={subtitle || "Every hang ticket attached to this wine."}
      >
        <WineExploreSearch />
      </PageHeader>
      <div className="space-y-4 px-4 py-4">
        {verdict ? (
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <VerdictStat label="Avg score" value={formatScore(verdict.average)} />
            <VerdictStat
              label="Tickets"
              value={ticketsLoading && !tickets ? "—" : String(verdict.tickets)}
            />
            <VerdictStat label="From friends" value={String(verdict.friendTickets)} />
            <VerdictStat
              label="Avg price"
              value={formatPrice(verdict.averagePrice) ?? "—"}
            />
          </dl>
        ) : null}

        {viewerId ? (
          <div className="flex rounded-full border border-border bg-card p-1">
            <button
              type="button"
              className={cn(
                "flex-1 rounded-full py-1.5 text-xs font-medium",
                scope === "friends" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => setScope("friends")}
            >
              Friends
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 rounded-full py-1.5 text-xs font-medium",
                scope === "everyone" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => setScope("everyone")}
            >
              Everyone
            </button>
          </div>
        ) : null}

        {ticketsLoading && list.length === 0 ? (
          <EmptyState title="Pouring tickets" body="Finding posts for this wine…" />
        ) : shown.length === 0 ? (
          <EmptyState
            title={scope === "friends" ? "No friend tickets yet" : "No hang tickets yet"}
            body={
              scope === "friends"
                ? "Nobody you follow has hung this bottle. Switch to Everyone."
                : "Nobody has hung this bottle. Be the first from Hang."
            }
          />
        ) : (
          shown.map((ticket, index) => (
            <HangTicketCard key={ticket.id} ticket={ticket} priority={index === 0} />
          ))
        )}
      </div>
    </>
  );
}

function VerdictStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-3">
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
