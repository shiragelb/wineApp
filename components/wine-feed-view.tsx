"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { HangTicketCard } from "@/components/hang-ticket-card";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { WineExploreSearch } from "@/components/wine-explore-search";
import { useWine, useWineTickets } from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function WineFeedView() {
  const params = useParams<{ wineId: string }>();
  const wineId = decodeURIComponent(params.wineId ?? "");
  const configured = isSupabaseConfigured();
  const { data: wine, error, isLoading } = useWine(configured && wineId ? wineId : null);
  const { data: tickets, isLoading: ticketsLoading } = useWineTickets(
    configured && wineId ? wineId : null
  );

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
            body="Search again from the feed, or hang a ticket with a new bottle."
          />
        </div>
      </>
    );
  }

  const list = tickets ?? [];
  const subtitle = [wine.winery, wine.region, wine.grapes].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader
        backHref="/"
        eyebrow="Bottles hung"
        title={wine.name}
        description={subtitle || "Every hang ticket attached to this wine."}
      >
        <WineExploreSearch />
      </PageHeader>
      <div className="space-y-4 px-4 py-4">
        {ticketsLoading && list.length === 0 ? (
          <EmptyState title="Pouring tickets" body="Finding posts for this wine…" />
        ) : list.length === 0 ? (
          <EmptyState
            title="No hang tickets yet"
            body="Nobody has hung this bottle. Be the first from Upload."
          />
        ) : (
          list.map((ticket, index) => (
            <HangTicketCard key={ticket.id} ticket={ticket} priority={index === 0} />
          ))
        )}
      </div>
    </>
  );
}
