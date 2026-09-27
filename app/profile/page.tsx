import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { HangTicketCard } from "@/components/hang-ticket-card";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { SignOutButton } from "@/components/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { hangTicketSelect, mapTicketRow } from "@/lib/tickets";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          eyebrow="Your cellar"
          title="Profile"
          description="Public handle, avatar, and the tickets you hang."
        />
        <SetupNeeded />
      </>
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  if (!userId) {
    return (
      <>
        <PageHeader
          eyebrow="Your cellar"
          title="Profile"
          description="Sign in to see the tickets you hang."
        />
        <div className="space-y-5 px-4 py-5">
          <EmptyState
            title="Not signed in"
            body="Create an account or sign in to keep a cellar of hang tickets."
          />
          <Link
            href="/login?next=/profile"
            className={cn(buttonVariants(), "h-11 w-full")}
          >
            Sign in
          </Link>
        </div>
      </>
    );
  }

  const [{ data: profile }, { data: ticketRows }, { count: following }, { count: followers }] =
    await Promise.all([
      supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
      supabase
        .from("hang_tickets")
        .select(hangTicketSelect)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId),
    ]);

  const tickets = (ticketRows ?? []).map((row) => mapTicketRow(row));
  const username = profile?.username ?? "guest";

  const stats = [
    { label: "Tickets", value: String(tickets.length) },
    { label: "Following", value: String(following ?? 0) },
    { label: "Followers", value: String(followers ?? 0) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Your cellar"
        title="Profile"
        description="The bottles you have hung so far."
      />
      <div className="space-y-6 px-4 py-5">
        <section className="flex items-center gap-4">
          <div
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
          >
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl leading-none tracking-tight">{username}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Signed in</p>
          </div>
        </section>

        <dl className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
          {stats.map((stat) => (
            <div key={stat.label} className="px-2 py-3 text-center">
              <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {stat.label}
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>

        {tickets.length === 0 ? (
          <EmptyState
            title="No tickets yet"
            body="When you hang a bottle, it will show up here."
          />
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <HangTicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}

        <SignOutButton />
      </div>
    </>
  );
}
