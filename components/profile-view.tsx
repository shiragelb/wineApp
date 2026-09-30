"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { FollowStatsBar } from "@/components/follow-stats-bar";
import { HangTicketCard } from "@/components/hang-ticket-card";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { Button, buttonVariants } from "@/components/ui/button";
import { useProfile, useFollowStats, useSessionUserId, useTickets } from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { profileHandle, profileInitials, profileTitle, publicAvatarUrl } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function ProfileView() {
  const configured = isSupabaseConfigured();
  const { data: userId, isLoading: sessionLoading } = useSessionUserId();
  const { data: profile, isLoading: profileLoading } = useProfile(userId ?? null);
  const { data: tickets, isLoading: ticketsLoading } = useTickets(
    userId ?? undefined,
    Boolean(userId)
  );
  const { data: followStats, isLoading: statsLoading } = useFollowStats(userId ?? null);
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
          <Link
            href="/signup?next=/profile"
            prefetch={true}
            className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}
          >
            Create account
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
  const photo = publicAvatarUrl(profile?.avatar_url);
  const list = tickets ?? [];
  const followHref = profile?.username
    ? `/u/${encodeURIComponent(profile.username)}`
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Your cellar"
        title="Profile"
        description="The bottles you have hung so far."
        actions={
          <Link
            href="/settings"
            prefetch={true}
            aria-label="Settings"
            className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
          >
            <Settings className="size-5" aria-hidden />
          </Link>
        }
      />
      <div className="space-y-6 px-4 py-5">
        <section className="flex items-center gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {photo ? (
              <Image
                src={photo}
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
            <h2 className="truncate text-xl leading-none tracking-tight">
              {profile ? title : profileLoading ? "Loading…" : title}
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {handle ?? "@username"}
            </p>
          </div>
        </section>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          disabled={profileLoading && !profile}
          onClick={() => setEditing(true)}
        >
          Edit profile
        </Button>

        <FollowStatsBar
          tickets={String(list.length)}
          following={String(followStats?.following ?? 0)}
          followers={String(followStats?.followers ?? 0)}
          loadingTickets={ticketsLoading && !tickets}
          loadingFollows={statsLoading && !followStats}
          followingHref={followHref ? `${followHref}/following` : "/people"}
          followersHref={followHref ? `${followHref}/followers` : "/people"}
        />

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
