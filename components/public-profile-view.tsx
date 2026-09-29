"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { EmptyState } from "@/components/empty-state";
import { FollowButton } from "@/components/follow-button";
import { FollowStatsBar } from "@/components/follow-stats-bar";
import { HangTicketCard } from "@/components/hang-ticket-card";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { useFollowStats, useProfileByUsername, useTickets } from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { profileHandle, profileInitials, profileTitle, publicAvatarUrl } from "@/lib/profile";

export function PublicProfileView() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username ?? "");
  const configured = isSupabaseConfigured();
  const { data: profile, error, isLoading } = useProfileByUsername(
    configured && username ? username : null
  );
  const { data: tickets, isLoading: ticketsLoading } = useTickets(
    profile?.id,
    Boolean(profile?.id)
  );
  const { data: followStats, isLoading: statsLoading } = useFollowStats(
    profile?.id ?? null
  );

  if (!configured) {
    return (
      <>
        <PageHeader backHref="/" eyebrow="Cellar" title="Profile" />
        <SetupNeeded />
      </>
    );
  }

  if (isLoading && !profile) {
    return (
      <>
        <PageHeader backHref="/" eyebrow="Cellar" title="Profile" />
        <div className="px-4 py-5">
          <EmptyState title="Opening cellar" body="Loading this drinker’s tickets…" />
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <PageHeader backHref="/" eyebrow="Cellar" title="Not found" />
        <div className="px-4 py-5">
          <EmptyState
            title="Nobody by that handle"
            body="That profile is missing, or the username changed."
          />
        </div>
      </>
    );
  }

  const title = profileTitle(profile);
  const handle = profileHandle(profile) ?? `@${profile.username}`;
  const initials = profileInitials(profile);
  const photo = publicAvatarUrl(profile.avatar_url);
  const list = tickets ?? [];

  return (
    <>
      <PageHeader
        backHref="/"
        eyebrow="Cellar"
        title={title}
        description="Bottles this person has hung."
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
            <h2 className="truncate text-xl leading-none tracking-tight">{title}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{handle}</p>
          </div>
          <FollowButton profileId={profile.id} size="default" />
        </section>

        <FollowStatsBar
          tickets={String(list.length)}
          following={String(followStats?.following ?? 0)}
          followers={String(followStats?.followers ?? 0)}
          loadingTickets={ticketsLoading && !tickets}
          loadingFollows={statsLoading && !followStats}
          followingHref={`/u/${encodeURIComponent(profile.username)}/following`}
          followersHref={`/u/${encodeURIComponent(profile.username)}/followers`}
        />

        {ticketsLoading && list.length === 0 ? (
          <EmptyState title="Loading tickets" body="Pulling the bottles they have hung." />
        ) : list.length === 0 ? (
          <EmptyState
            title="No tickets yet"
            body="This cellar is still empty."
          />
        ) : (
          <div className="space-y-4">
            {list.map((ticket, index) => (
              <HangTicketCard key={ticket.id} ticket={ticket} priority={index === 0} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
