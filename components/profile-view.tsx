"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { HangTicketCard } from "@/components/hang-ticket-card";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { SignOutButton } from "@/components/sign-out-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { useProfile, useSessionUserId, useTickets } from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { profileHandle, profileInitials, profileTitle } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function ProfileView() {
  const configured = isSupabaseConfigured();
  const { data: userId, isLoading: sessionLoading } = useSessionUserId();
  const { data: profile } = useProfile(userId ?? null);
  const { data: tickets, isLoading: ticketsLoading } = useTickets(userId ?? undefined);
  const [editing, setEditing] = useState(false);

  if (!configured) {
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

  if (sessionLoading && !userId) {
    return (
      <>
        <PageHeader eyebrow="Your cellar" title="Profile" />
        <div className="px-4 py-5">
          <EmptyState title="Checking your cellar" body="Loading your session…" />
        </div>
      </>
    );
  }

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
            prefetch={true}
            className={cn(buttonVariants(), "h-11 w-full")}
          >
            Sign in
          </Link>
        </div>
      </>
    );
  }

  const title = profile
    ? profileTitle(profile)
    : "Wine guest";
  const handle = profile ? profileHandle(profile) : null;
  const initials = profile
    ? profileInitials(profile)
    : "HT";
  const list = tickets ?? [];

  const stats = [
    { label: "Tickets", value: ticketsLoading && !tickets ? "—" : String(list.length) },
    { label: "Following", value: "0" },
    { label: "Followers", value: "0" },
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
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt=""
                width={64}
                height={64}
                priority
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl leading-none tracking-tight">{title}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {handle ?? "Add a nickname so friends recognize you"}
            </p>
          </div>
        </section>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          onClick={() => setEditing(true)}
        >
          Edit profile
        </Button>

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

        {ticketsLoading && list.length === 0 ? (
          <EmptyState title="Loading tickets" body="Pulling the bottles you have hung." />
        ) : list.length === 0 ? (
          <EmptyState
            title="No tickets yet"
            body="When you hang a bottle, it will show up here."
          />
        ) : (
          <div className="space-y-4">
            {list.map((ticket, index) => (
              <HangTicketCard key={ticket.id} ticket={ticket} priority={index === 0} />
            ))}
          </div>
        )}

        <SignOutButton />
      </div>

      <EditProfileDialog
        open={editing}
        onOpenChange={setEditing}
        userId={userId}
        profile={profile ?? null}
      />
    </>
  );
}
