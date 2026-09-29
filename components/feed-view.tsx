"use client";

import { EmptyState } from "@/components/empty-state";
import { HangTicketCard } from "@/components/hang-ticket-card";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { mockTickets } from "@/lib/mock-tickets";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useTickets } from "@/lib/hooks";
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
  const { data, error, isLoading } = useTickets();
  const tickets = configured ? (data ?? []) : fromMock();

  return (
    <>
      <PageHeader
        eyebrow="Hang Tickets"
        title="Tonight’s pours"
        description="A casual feed of bottles friends actually opened — photos first, cellar notes second."
      />
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
          <EmptyState title="Pouring the feed" body="Loading hang tickets…" />
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
