"use client";

import { EmptyState } from "@/components/empty-state";
import { HangTicketCard } from "@/components/hang-ticket-card";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { WineExploreSearch } from "@/components/wine-explore-search";
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
        eyebrow="Hang Tickets"
        title="For you"
        description={
          viewerId
            ? "Friends you follow come first, then bottles that match what you rate highly, then what’s newly hung."
            : "Newest pours first. Sign in to follow people and rank the feed around your cellar."
        }
      >
        <WineExploreSearch />
      </PageHeader>
      {!configured ? <SetupNeeded /> : null}
      <div className="space-y-4 px-4 py-4">
        {configured && error ? (
          <EmptyState
            title={
              error.message.includes("schema cache") ||
              error.message.includes("display_name")
                ? "Database needs a profile update"
                : "Could not load tickets"
            }
            body={
              error.message.includes("display_name")
                ? "Run supabase/profiles-display-name.sql in the SQL Editor, then refresh."
                : error.message.includes("schema cache")
                  ? "Run supabase/schema.sql, then storage.sql and seed.sql, in the Supabase SQL Editor."
                  : error.message
            }
          />
        ) : configured && isLoading && tickets.length === 0 ? (
          <EmptyState title="Pouring the feed" body="Ranking hang tickets for you…" />
        ) : tickets.length === 0 ? (
          <EmptyState
            title="The rail is empty"
            body="Sign in and hang the first bottle. It will show up here."
          />
        ) : (
          tickets.map((ticket, index) => (
            <HangTicketCard
              key={ticket.id}
              ticket={ticket}
              priority={index === 0}
            />
          ))
        )}
      </div>
    </>
  );
}
