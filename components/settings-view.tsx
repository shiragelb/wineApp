"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { PageHeader } from "@/components/page-header";
import { PersonRow } from "@/components/person-row";
import { SetupNeeded } from "@/components/setup-needed";
import { SignOutButton } from "@/components/sign-out-button";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  useMutedIds,
  usePeopleSearch,
  useProfile,
  useSessionUserId,
} from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const configured = isSupabaseConfigured();
  const { data: userId, isLoading } = useSessionUserId();
  const { data: profile } = useProfile(userId ?? null);
  const { data: mutedIds } = useMutedIds(userId ?? null);
  const { data: people } = usePeopleSearch("");
  const mutedPeople = (people ?? []).filter((person) => person.id && mutedIds?.includes(person.id));
  const [editing, setEditing] = useState(false);

  if (!configured) {
    return (
      <>
        <PageHeader backHref="/profile" eyebrow="Account" title="Settings" />
        <SetupNeeded />
      </>
    );
  }

  if (isLoading && userId === undefined) {
    return (
      <>
        <PageHeader backHref="/profile" title="Settings" />
        <div className="px-4 py-5">
          <EmptyState title="Loading settings" body="Checking your session…" />
        </div>
      </>
    );
  }

  if (!userId) {
    return (
      <>
        <PageHeader
          backHref="/profile"
          eyebrow="Account"
          title="Settings"
          description="Sign in to edit your profile and mute people."
        />
        <div className="space-y-2 px-4 py-5">
          <Link href="/login?next=/settings" prefetch={true} className={cn(buttonVariants(), "h-11 w-full")}>
            Sign in
          </Link>
          <Link href="/signup?next=/settings" prefetch={true} className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}>
            Create account
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        backHref="/profile"
        eyebrow="Account"
        title="Settings"
        description="Profile, people, and who you would rather not see in the feed."
      />
      <div className="space-y-6 px-4 py-5">
        <section className="space-y-2">
          <Button type="button" variant="outline" className="h-11 w-full" onClick={() => setEditing(true)}>
            Edit profile
          </Button>
          <Link
            href="/notifications"
            prefetch={true}
            className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}
          >
            Notifications
          </Link>
          <Link
            href="/people"
            prefetch={true}
            className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}
          >
            Find people
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Muted</h2>
          {mutedPeople.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nobody is muted. You can mute from a followers or following list.
            </p>
          ) : (
            mutedPeople.map((person) => (
              <PersonRow key={person.id ?? person.username} person={person} showMute />
            ))
          )}
        </section>

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
