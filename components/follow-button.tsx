"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useFollowingIds, useSessionUserId } from "@/lib/hooks";
import {
  followUser,
  patchFollowCaches,
  revalidateFollows,
  unfollowUser,
} from "@/lib/follows";
import { cn } from "@/lib/utils";

export function FollowButton({
  profileId,
  className,
  size = "sm",
}: {
  profileId?: string;
  className?: string;
  size?: "sm" | "default";
}) {
  const pathname = usePathname();
  const { data: viewerId, isLoading: sessionLoading } = useSessionUserId();
  const { data: followingIds } = useFollowingIds(viewerId ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profileId) return null;
  if (sessionLoading && viewerId === undefined) return null;
  if (viewerId && profileId === viewerId) return null;

  const targetId = profileId;
  const following = Boolean(viewerId && followingIds?.includes(targetId));
  const nextHref = pathname.startsWith("/login")
    ? "/login"
    : `/login?next=${encodeURIComponent(pathname || "/")}`;

  if (!viewerId) {
    return (
      <Link
        href={nextHref}
        prefetch={true}
        className={cn(
          "inline-flex h-7 shrink-0 items-center rounded-lg bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground",
          size === "default" && "h-9 px-3 text-sm",
          className
        )}
      >
        Follow
      </Link>
    );
  }

  const me = viewerId;

  async function toggle() {
    if (pending) return;
    const nextFollowing = !following;
    setError(null);
    setPending(true);
    patchFollowCaches(me, targetId, nextFollowing);

    try {
      if (nextFollowing) await followUser(targetId);
      else await unfollowUser(targetId);
      revalidateFollows(me, targetId);
    } catch (caught) {
      patchFollowCaches(me, targetId, following);
      setError(caught instanceof Error ? caught.message : "Could not update follow.");
      revalidateFollows(me, targetId);
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex shrink-0 flex-col items-end gap-1">
      <Button
        type="button"
        size={size}
        variant={following ? "outline" : "default"}
        disabled={pending}
        aria-pressed={following}
        className={cn(size === "default" && "h-9 px-3", className)}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void toggle();
        }}
      >
        {pending ? "Saving…" : following ? "Following" : "Follow"}
      </Button>
      {error ? (
        <span className="max-w-40 text-right text-[11px] leading-tight text-destructive">
          {error}
        </span>
      ) : null}
    </span>
  );
}
