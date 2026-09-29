"use client";

import { EmptyState } from "@/components/empty-state";
import { HangTicketCard } from "@/components/hang-ticket-card";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { mockTickets } from "@/lib/mock-tickets";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useDiscoveryFeed, useSessionUserId } from "@/lib/hooks";
import type { HangTicketView } from "@/lib/tickets";

function fromMock(): HangTicketView[] {
  return mockTickets.map((ticket) => ({
    ...ticket,
    displayName: `@${ticket.username}`,
    handle: `@${ticket.username}`,
  }));
}

export function FeedView() {
  const configured = isSupabaseConfigured();
  const { data: viewerId } = useSessionUserId();
  const { data, error, isLoading } = useDiscoveryFeed();
  const tickets = configured ? (data ?? []) : fromMock();

  return (
    <>
      <PageHeader
        eyebrow="Friends"
        title="Pours"
        description={
          viewerId
            ? "People you follow first, then bottles that match what you rate highly."
            : "Newest pours. Sign in so friends can sit at the front of this list."
        }
      />
      {!configured ? <SetupNeeded /> : null}
      <div className="space-y-4 px-4 py-4">
        {configured && error ? (
          <EmptyState title="Could not load tickets" body={error.message} />
        ) : configured && isLoading && tickets.length === 0 ? (
          <EmptyState title="Pouring the feed" body="Ranking hang tickets for you…" />
        ) : tickets.length === 0 ? (
          <EmptyState
            title="The rail is empty"
            body="Hang a bottle, or follow someone who already has."
          />
        ) : (
          tickets.map((ticket, index) => (
            <HangTicketCard key={ticket.id} ticket={ticket} priority={index === 0} />
          ))
        )}
      </div>
    </>
  );
}
