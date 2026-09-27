import { HangTicketCard } from "@/components/hang-ticket-card";
import { PageHeader } from "@/components/page-header";
import { mockTickets } from "@/lib/mock-tickets";

export default function FeedPage() {
  return (
    <>
      <PageHeader
        eyebrow="Hang Tickets"
        title="Tonight’s pours"
        description="A casual feed of bottles friends actually opened — photos first, cellar notes second."
      />
      <div className="space-y-4 px-4 py-4">
        {mockTickets.map((ticket) => (
          <HangTicketCard key={ticket.id} ticket={ticket} />
        ))}
        <p className="px-2 pt-1 pb-2 text-center text-xs text-muted-foreground">
          These tickets are placeholders. Live posts land after Supabase auth.
        </p>
      </div>
    </>
  );
}
