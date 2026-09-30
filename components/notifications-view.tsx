"use client";

import { useEffect } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { buttonVariants } from "@/components/ui/button";
import {
  markNotificationsSeen,
  useNotifications,
  useSessionUserId,
} from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { profilePath, winePath } from "@/lib/tickets";
import { profileTitle } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function NotificationsView() {
  const configured = isSupabaseConfigured();
  const { data: userId, isLoading: sessionLoading } = useSessionUserId();
  const { data, error, isLoading } = useNotifications(userId ?? null);

  useEffect(() => {
    if (!data?.length) return;
    markNotificationsSeen(data.map((item) => item.id));
  }, [data]);

  if (!configured) {
    return (
      <>
        <PageHeader backHref="/" title="Notifications" />
        <SetupNeeded />
      </>
    );
  }

  if (sessionLoading && userId === undefined) {
    return (
      <>
        <PageHeader backHref="/" title="Notifications" />
        <div className="px-4 py-5">
          <EmptyState title="Checking" body="Loading your session…" />
        </div>
      </>
    );
  }

  if (!userId) {
    return (
      <>
        <PageHeader
          backHref="/"
          title="Notifications"
          description="Sign in to see new followers and bottles friends hung."
        />
        <div className="space-y-2 px-4 py-5">
          <Link href="/login?next=/notifications" prefetch={true} className={cn(buttonVariants(), "h-11 w-full")}>
            Sign in
          </Link>
          <Link href="/signup?next=/notifications" prefetch={true} className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}>
            Create account
          </Link>
        </div>
      </>
    );
  }

  const list = data ?? [];

  return (
    <>
      <PageHeader
        backHref="/"
        eyebrow="Inbox"
        title="Notifications"
        description="New followers, and hang tickets from people you follow."
      />
      <div className="space-y-2 px-4 py-5">
        {error ? (
          <EmptyState title="Could not load" body={error.message} />
        ) : isLoading && list.length === 0 ? (
          <EmptyState title="Loading" body="Checking follows and pours…" />
        ) : list.length === 0 ? (
          <EmptyState
            title="Quiet for now"
            body="When someone follows you, or a friend hangs a bottle, it lands here."
          />
        ) : (
          list.map((item) => {
            const href =
              item.kind === "friend_ticket" && item.ticket?.wineId
                ? winePath(item.ticket.wineId)
                : profilePath(item.actor.username);
            return (
              <Link
                key={item.id}
                href={href}
                prefetch={true}
                className="block rounded-2xl border border-border/80 bg-card px-4 py-3 hover:bg-muted/50"
              >
                <p className="text-sm font-medium">
                  {item.kind === "follow"
                    ? `${profileTitle(item.actor)} followed you`
                    : `${profileTitle(item.actor)} hung ${item.ticket?.wine ?? "a bottle"}`}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.kind === "follow"
                    ? "Open their cellar"
                    : item.ticket
                      ? `${item.ticket.rating}/5 · see what they thought`
                      : "Open the wine"}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
