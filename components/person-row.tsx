"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FollowButton } from "@/components/follow-button";
import { Button } from "@/components/ui/button";
import {
  useMutedIds,
  useSessionUserId,
} from "@/lib/hooks";
import {
  muteUser,
  patchMuteCaches,
  revalidateMutes,
  unmuteUser,
} from "@/lib/mutes";
import {
  profileHandle,
  profileInitials,
  profileTitle,
  publicAvatarUrl,
  type ProfileRow,
} from "@/lib/profile";
import { profilePath } from "@/lib/tickets";

export function PersonRow({
  person,
  showMute = false,
}: {
  person: ProfileRow;
  showMute?: boolean;
}) {
  const { data: viewerId } = useSessionUserId();
  const { data: mutedIds } = useMutedIds(viewerId ?? null);
  const [pending, setPending] = useState(false);
  const profileId = person.id;
  const title = profileTitle(person);
  const handle = profileHandle(person);
  const photo = publicAvatarUrl(person.avatar_url);
  const initials = profileInitials(person);
  const muted = Boolean(profileId && mutedIds?.includes(profileId));

  async function toggleMute() {
    if (!viewerId || !profileId || pending) return;
    setPending(true);
    patchMuteCaches(viewerId, profileId, !muted);
    try {
      if (muted) await unmuteUser(profileId);
      else await muteUser(profileId);
      revalidateMutes(viewerId);
    } catch {
      patchMuteCaches(viewerId, profileId, muted);
      revalidateMutes(viewerId);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-3 py-2.5">
      <Link
        href={profilePath(person.username)}
        prefetch={true}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="relative flex size-11 shrink-0 overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {photo ? (
            <Image src={photo} alt="" width={44} height={44} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center">{initials}</span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {handle ?? `@${person.username}`}
            {muted ? " · Muted" : ""}
          </span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        {showMute && viewerId && profileId && viewerId !== profileId ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => void toggleMute()}
          >
            {muted ? "Unmute" : "Mute"}
          </Button>
        ) : null}
        <FollowButton profileId={profileId} />
      </div>
    </div>
  );
}
