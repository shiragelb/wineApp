"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PersonRow } from "@/components/person-row";
import { SetupNeeded } from "@/components/setup-needed";
import { Input } from "@/components/ui/input";
import { usePeopleSearch } from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function PeopleSearchView() {
  const configured = isSupabaseConfigured();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const { data, error, isLoading } = usePeopleSearch(configured ? debounced : "");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  if (!configured) {
    return (
      <>
        <PageHeader backHref="/" eyebrow="People" title="Find drinkers" />
        <SetupNeeded />
      </>
    );
  }

  const list = data ?? [];

  return (
    <>
      <PageHeader
        backHref="/"
        eyebrow="People"
        title="Find drinkers"
        description="Search a username or nickname, then follow their cellar."
      />
      <div className="space-y-4 px-4 py-5">
        <Input
          className="h-11 bg-card px-3"
          value={query}
          placeholder="Search @username or nickname"
          onChange={(event) => setQuery(event.target.value)}
        />
        {error ? (
          <EmptyState title="Could not search" body={error.message} />
        ) : isLoading && list.length === 0 ? (
          <EmptyState title="Searching" body="Looking through cellars…" />
        ) : list.length === 0 ? (
          <EmptyState
            title="No matches"
            body="Try a different handle. Nicknames can repeat; usernames cannot."
          />
        ) : (
          <div className="space-y-2">
            {list.map((person) => (
              <PersonRow key={person.id ?? person.username} person={person} showMute />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
