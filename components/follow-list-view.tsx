"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PersonRow } from "@/components/person-row";
import { SetupNeeded } from "@/components/setup-needed";
import { useFollowList, useProfileByUsername, useSessionUserId } from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { profilePath } from "@/lib/tickets";

export function FollowListView({ kind }: { kind: "followers" | "following" }) {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username ?? "");
  const configured = isSupabaseConfigured();
  const { data: viewerId } = useSessionUserId();
  const { data: profile, error, isLoading } = useProfileByUsername(
    configured && username ? username : null
  );
  const { data: people, isLoading: listLoading } = useFollowList(
    profile?.id ?? null,
    kind
  );

  const title = kind === "followers" ? "Followers" : "Following";
  const back = username ? profilePath(username) : "/";

  if (!configured) {
    return (
      <>
        <PageHeader backHref={back} title={title} />
        <SetupNeeded />
      </>
    );
  }

  if (isLoading && !profile) {
    return (
      <>
        <PageHeader backHref={back} title={title} />
        <div className="px-4 py-5">
          <EmptyState title="Opening the list" body="Loading people…" />
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <PageHeader backHref="/" title="Not found" />
        <div className="px-4 py-5">
          <EmptyState title="Nobody by that handle" body="That profile is missing." />
        </div>
      </>
    );
  }

  const list = people ?? [];
  const showMute = Boolean(viewerId);

  return (
    <>
      <PageHeader
        backHref={back}
        eyebrow={`@${profile.username}`}
        title={title}
        description={
          kind === "followers"
            ? "People who follow this cellar."
            : "People this cellar follows."
        }
      />
      <div className="space-y-2 px-4 py-5">
        {listLoading && list.length === 0 ? (
          <EmptyState title="Loading" body="Pulling the social graph…" />
        ) : list.length === 0 ? (
          <EmptyState
            title={kind === "followers" ? "No followers yet" : "Not following anyone"}
            body={
              kind === "followers"
                ? "When someone follows, they will show up here."
                : "Follow people from posts or search."
            }
          />
        ) : (
          list.map((person) => (
            <PersonRow key={person.id ?? person.username} person={person} showMute={showMute} />
          ))
        )}
      </div>
    </>
  );
}
