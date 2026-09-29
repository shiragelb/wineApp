import Link from "next/link";

export function FollowStatsBar({
  tickets,
  following,
  followers,
  loadingTickets,
  loadingFollows,
  followingHref,
  followersHref,
}: {
  tickets: string;
  following: string;
  followers: string;
  loadingTickets?: boolean;
  loadingFollows?: boolean;
  followingHref: string;
  followersHref: string;
}) {
  return (
    <dl className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
      <div className="px-2 py-3 text-center">
        <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Tickets
        </dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums">
          {loadingTickets ? "—" : tickets}
        </dd>
      </div>
      <Link href={followingHref} prefetch={true} className="px-2 py-3 text-center hover:bg-muted/60">
        <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Following
        </dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums">
          {loadingFollows ? "—" : following}
        </dd>
      </Link>
      <Link href={followersHref} prefetch={true} className="px-2 py-3 text-center hover:bg-muted/60">
        <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Followers
        </dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums">
          {loadingFollows ? "—" : followers}
        </dd>
      </Link>
    </dl>
  );
}
