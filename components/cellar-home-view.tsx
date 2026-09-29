"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Search, Star } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { WineExploreSearch } from "@/components/wine-explore-search";
import {
  unreadNotificationCount,
  useFollowingIds,
  useNotifications,
  useSessionUserId,
  useWineCatalog,
} from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { winePath, type CanonicalWine, type HangTicketView } from "@/lib/tickets";
import { formatPrice, formatScore, wineVerdict } from "@/lib/wine-verdict";
import {
  WINE_COLORS,
  inferWineColor,
  wineRegionGroup,
  type WineColor,
} from "@/lib/wine-style";
import { cn } from "@/lib/utils";

function isColor(value: string | null): value is WineColor {
  return value === "red" || value === "white" || value === "rose" || value === "orange";
}

export function CellarHomeView() {
  const configured = isSupabaseConfigured();
  const router = useRouter();
  const params = useSearchParams();
  const color = isColor(params.get("color")) ? params.get("color") : null;
  const region = params.get("region");
  const { data: viewerId } = useSessionUserId();
  const { data: followingIds } = useFollowingIds(viewerId ?? null);
  const { data: notes } = useNotifications(viewerId ?? null);
  const { data: catalog, error, isLoading } = useWineCatalog();
  const unread = unreadNotificationCount(notes);

  function setFilter(next: { color?: string | null; region?: string | null }) {
    const query = new URLSearchParams();
    const nextColor = next.color === undefined ? color : next.color;
    const nextRegion = next.region === undefined ? region : next.region;
    if (nextColor) query.set("color", nextColor);
    if (nextColor && nextRegion) query.set("region", nextRegion);
    const suffix = query.toString();
    router.replace(suffix ? `/?${suffix}` : "/", { scroll: false });
  }

  const wines = catalog?.wines ?? [];
  const tickets = catalog?.tickets ?? [];
  const friends = new Set(followingIds ?? []);
  const colored = color
    ? wines.filter((wine) => inferWineColor(wine) === color)
    : wines;
  const regions = [...new Set(colored.map((wine) => wineRegionGroup(wine.region)))].sort();
  const visible = region ? colored.filter((wine) => wineRegionGroup(wine.region) === region) : colored;

  const friendPours = tickets.filter((ticket) => {
    if (!ticket.userId || !friends.has(ticket.userId) || ticket.rating < 4) return false;
    const wine = wines.find((row) => row.id === ticket.wineId);
    if (!wine) return false;
    if (color && inferWineColor(wine) !== color) return false;
    if (region && wineRegionGroup(wine.region) !== region) return false;
    return true;
  });

  const recommended = uniqueWines(
    friendPours
      .map((ticket) => wines.find((wine) => wine.id === ticket.wineId))
      .filter((wine): wine is CanonicalWine => Boolean(wine))
  );

  const selected = WINE_COLORS.find((item) => item.id === color);

  return (
    <>
      <PageHeader
        eyebrow="Before you buy"
        title={selected ? selected.label : "The cellar"}
        description={
          selected
            ? "Pick a region, then see what friends actually hung — ratings first, photos second."
            : "Look up a bottle, or start with a color. The point is what people thought before you spend."
        }
        actions={
          <>
            <Link
              href="/people"
              prefetch={true}
              aria-label="Find people"
              className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
            >
              <Search className="size-5" aria-hidden />
            </Link>
            <Link
              href="/notifications"
              prefetch={true}
              aria-label="Notifications"
              className="relative flex size-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
            >
              <Bell className="size-5" aria-hidden />
              {unread > 0 ? (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
              ) : null}
            </Link>
          </>
        }
      >
        <WineExploreSearch />
      </PageHeader>
      {!configured ? <SetupNeeded /> : null}
      <div className="space-y-6 px-4 py-5">
        {configured && error ? (
          <EmptyState title="Could not load the cellar" body={error.message} />
        ) : configured && isLoading && wines.length === 0 ? (
          <EmptyState title="Opening the cellar" body="Pulling bottles you can browse…" />
        ) : !color ? (
          <section className="grid grid-cols-2 gap-3">
            {WINE_COLORS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter({ color: item.id, region: null })}
                className="overflow-hidden rounded-3xl p-4 text-left shadow-[0_12px_28px_-18px_rgba(70,24,16,0.55)] transition-transform active:scale-[0.98]"
                style={{
                  background: `linear-gradient(145deg, ${item.from}, ${item.to})`,
                  color: item.ink,
                }}
              >
                <span className="block text-lg font-semibold tracking-tight">{item.label}</span>
                <span className="mt-1 block text-xs opacity-80">{item.hint}</span>
              </button>
            ))}
          </section>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilter({ color: null, region: null })}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
              >
                All colors
              </button>
              <button
                type="button"
                onClick={() => setFilter({ region: null })}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium",
                  !region ? "bg-primary text-primary-foreground" : "border border-border bg-card"
                )}
              >
                All regions
              </button>
              {regions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setFilter({ region: name === region ? null : name })}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium",
                    region === name
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>

            {recommended.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-base font-semibold tracking-tight">Friends recommend</h2>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {recommended.map((wine) => (
                    <WineCard
                      key={wine.id}
                      wine={wine}
                      tickets={tickets}
                      friendIds={friends}
                      compact
                    />
                  ))}
                </div>
              </section>
            ) : (
              <p className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
                {viewerId
                  ? "Nobody you follow has hung this color yet. Browse the grid, or hang one of your own."
                  : "Sign in and follow people to see friends’ bottles in this color."}
              </p>
            )}

            {visible.length === 0 ? (
              <EmptyState
                title="Nothing in this slice"
                body="Try another region, or search the bottle by name."
              />
            ) : (
              <section className="grid grid-cols-2 gap-3">
                {visible.map((wine) => (
                  <WineCard key={wine.id} wine={wine} tickets={tickets} friendIds={friends} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

function uniqueWines(wines: CanonicalWine[]) {
  const seen = new Set<string>();
  return wines.filter((wine) => {
    if (seen.has(wine.id)) return false;
    seen.add(wine.id);
    return true;
  });
}

function WineCard({
  wine,
  tickets,
  friendIds,
  compact = false,
}: {
  wine: CanonicalWine;
  tickets: HangTicketView[];
  friendIds: Set<string>;
  compact?: boolean;
}) {
  const verdict = wineVerdict(wine.id, tickets, friendIds);
  const color = inferWineColor(wine);
  const meta = WINE_COLORS.find((item) => item.id === color) ?? WINE_COLORS[0];

  return (
    <Link
      href={winePath(wine.id)}
      prefetch={true}
      className={cn(
        "block overflow-hidden rounded-2xl border border-border/80 bg-card text-left shadow-[0_8px_20px_-16px_rgba(70,24,16,0.5)]",
        compact && "min-w-[220px] max-w-[220px] shrink-0"
      )}
    >
      <div
        className="h-16"
        style={{ background: `linear-gradient(145deg, ${meta.from}, ${meta.to})` }}
      />
      <div className="space-y-1 px-3 py-3">
        <p className="line-clamp-2 text-sm font-semibold tracking-tight">{wine.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {wine.winery}
          {wine.region ? ` · ${wineRegionGroup(wine.region)}` : ""}
        </p>
        <p className="flex items-center gap-1 pt-1 text-xs text-foreground/80">
          <Star className="size-3 fill-primary text-primary" aria-hidden />
          {verdict.tickets === 0
            ? "No tickets yet"
            : `${formatScore(verdict.average)} · ${verdict.tickets} ticket${verdict.tickets === 1 ? "" : "s"}`}
          {verdict.friendTickets > 0
            ? ` · ${verdict.friendTickets} friend${verdict.friendTickets === 1 ? "" : "s"}`
            : ""}
        </p>
        {formatPrice(verdict.averagePrice) ? (
          <p className="text-xs text-muted-foreground">Avg {formatPrice(verdict.averagePrice)}</p>
        ) : null}
      </div>
    </Link>
  );
}
