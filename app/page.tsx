import { EmptyState } from "@/components/empty-state";
import { HangTicketCard } from "@/components/hang-ticket-card";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { mockTickets } from "@/lib/mock-tickets";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { hangTicketSelect, mapTicketRow } from "@/lib/tickets";

export default async function FeedPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          eyebrow="Hang Tickets"
          title="Tonight’s pours"
          description="A casual feed of bottles friends actually opened — photos first, cellar notes second."
        />
        <SetupNeeded />
        <div className="space-y-4 px-4 pb-4">
          {mockTickets.map((ticket) => (
            <HangTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hang_tickets")
    .select(hangTicketSelect)
    .order("created_at", { ascending: false });

  const tickets = (data ?? []).map((row) => mapTicketRow(row));

  return (
    <>
      <PageHeader
        eyebrow="Hang Tickets"
        title="Tonight’s pours"
        description="A casual feed of bottles friends actually opened — photos first, cellar notes second."
      />
      <div className="space-y-4 px-4 py-4">
        {error ? (
          <EmptyState
            title={
              error.message.includes("schema cache")
                ? "Database schema is missing"
                : "Could not load tickets"
            }
            body={
              error.message.includes("schema cache")
                ? "Run supabase/schema.sql, then storage.sql and seed.sql, in the Supabase SQL Editor."
                : error.message
            }
          />
        ) : tickets.length === 0 ? (
          <EmptyState
            title="The rail is empty"
            body="Sign in and hang the first bottle. It will show up here."
          />
        ) : (
          tickets.map((ticket) => (
            <HangTicketCard key={ticket.id} ticket={ticket} />
          ))
        )}
      </div>
    </>
  );
}
