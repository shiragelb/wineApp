"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { resolvedDisplayName } from "@/lib/profile";
import type { ProfileRow } from "@/lib/profile";
import {
  CACHE_KEYS,
  mapTicketRow,
  hangTicketSelect,
  hangTicketSelectMid,
  hangTicketSelectFallback,
  type CanonicalWine,
  type HangTicketView,
  type TicketRow,
} from "@/lib/tickets";
import { parseGrapeShares } from "@/lib/wine-meta";
import { searchWineCatalog } from "@/lib/wineries";
import {
  buildTasteProfile,
  DISCOVERY_POOL,
  emptyTasteProfile,
  mergeTickets,
  rankDiscoveryFeed,
} from "@/lib/feed-rank";
import { fetchFollowStats, fetchFollowList, fetchFollowingIds, searchPeople } from "@/lib/follows";
import { fetchMutedIds } from "@/lib/mutes";
import { markNotificationsSeen, readSeenNotificationIds } from "@/lib/notifications";

function isMissingColumn(message: string) {
  return (
    message.includes("display_name") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("price") ||
    message.includes("color") ||
    message.includes("wine_type") ||
    message.includes("winery_id") ||
    message.includes("wineries") ||
    message.includes("grape_varietals")
  );
}

type TicketFilter = {
  userId?: string;
  userIds?: string[];
  wineId?: string;
  limit?: number;
};

export async function fetchTickets(filter?: TicketFilter): Promise<HangTicketView[]> {
  if (filter?.userIds && filter.userIds.length === 0) {
    return [];
  }

  const supabase = createClient();

  function buildQuery(
    select:
      | typeof hangTicketSelect
      | typeof hangTicketSelectMid
      | typeof hangTicketSelectFallback
  ) {
    let query = supabase
      .from("hang_tickets")
      .select(select)
      .order("created_at", { ascending: false });

    if (filter?.userId) query = query.eq("user_id", filter.userId);
    if (filter?.userIds?.length) query = query.in("user_id", filter.userIds);
    if (filter?.wineId) query = query.eq("wine_id", filter.wineId);
    if (filter?.limit) query = query.limit(filter.limit);
    return query;
  }

  const first = await buildQuery(hangTicketSelect);
  if (!first.error) {
    return ((first.data ?? []) as unknown as TicketRow[]).map(mapTicketRow);
  }

  if (!isMissingColumn(first.error.message)) {
    throw new Error(first.error.message);
  }

  const mid = await buildQuery(hangTicketSelectMid);
  if (!mid.error) {
    return ((mid.data ?? []) as unknown as TicketRow[]).map(mapTicketRow);
  }

  if (!isMissingColumn(mid.error.message)) {
    throw new Error(mid.error.message);
  }

  const fallback = await buildQuery(hangTicketSelectFallback);
  if (fallback.error) throw new Error(fallback.error.message);
  return ((fallback.data ?? []) as unknown as TicketRow[]).map(mapTicketRow);
}

export function useTickets(userId?: string, enabled = true) {
  const key = !enabled
    ? null
    : userId
      ? CACHE_KEYS.myTickets(userId)
      : CACHE_KEYS.tickets;

  return useSWR(
    isSupabaseConfigured() && key ? key : null,
    () => fetchTickets(userId ? { userId } : undefined),
    {
      keepPreviousData: true,
    }
  );
}

export function revalidateTickets(userId?: string) {
  void globalMutate(CACHE_KEYS.tickets);
  if (userId) {
    void globalMutate(CACHE_KEYS.myTickets(userId));
  }
  void globalMutate(
    (key) => Array.isArray(key) && key[0] === "wine-tickets",
    undefined,
    { revalidate: true }
  );
  void globalMutate(
    (key) => Array.isArray(key) && key[0] === "discovery-feed",
    undefined,
    { revalidate: true }
  );
  void globalMutate(CACHE_KEYS.catalog);
  void globalMutate(
    (key) => Array.isArray(key) && key[0] === "notifications",
    undefined,
    { revalidate: true }
  );
}

export async function fetchSessionUserId() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useSessionUserId() {
  return useSWR(isSupabaseConfigured() ? CACHE_KEYS.session : null, fetchSessionUserId, {
    keepPreviousData: true,
  });
}

async function selectProfile(
  column: "id" | "username",
  value: string
): Promise<ProfileRow | null> {
  const supabase = createClient();
  const full = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq(column, value)
    .maybeSingle();

  if (!full.error) {
    const row = full.data;
    if (!row) return null;
    const nickname = resolvedDisplayName(row);
    if (nickname) return { ...row, display_name: nickname };
    const { data: auth } = await supabase.auth.getUser();
    const metaName =
      auth.user && auth.user.id === row.id
        ? (auth.user.user_metadata?.display_name as string | undefined)?.trim()
        : undefined;
    return metaName ? { ...row, display_name: metaName } : row;
  }

  if (!isMissingColumn(full.error.message)) {
    throw new Error(full.error.message);
  }

  const fallback = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq(column, value)
    .maybeSingle();

  if (fallback.error) throw new Error(fallback.error.message);
  if (!fallback.data) return null;
  const nickname = resolvedDisplayName({
    display_name: null,
    avatar_url: fallback.data.avatar_url,
  });
  const { data: auth } = await supabase.auth.getUser();
  const metaName =
    auth.user && auth.user.id === fallback.data.id
      ? (auth.user.user_metadata?.display_name as string | undefined)?.trim()
      : undefined;
  return {
    ...fallback.data,
    display_name: nickname || metaName || null,
  };
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  return selectProfile("id", userId);
}

export function useProfile(userId: string | null) {
  return useSWR(
    userId ? CACHE_KEYS.profile(userId) : null,
    () => fetchProfile(userId as string),
    { keepPreviousData: true }
  );
}

export async function fetchProfileByUsername(username: string): Promise<ProfileRow | null> {
  return selectProfile("username", username);
}

export function useProfileByUsername(username: string | null) {
  return useSWR(
    username ? CACHE_KEYS.profileByUsername(username) : null,
    () => fetchProfileByUsername(username as string),
    { keepPreviousData: true }
  );
}

export async function fetchWine(wineId: string): Promise<CanonicalWine | null> {
  const supabase = createClient();
  for (const select of [
    "id, name, winery, region, grapes, color, wine_type, winery_id, wineries ( id, name, country, country_code, region )",
    "id, name, winery, region, grapes, color, wine_type, winery_id",
    "id, name, winery, region, grapes, color",
    "id, name, winery, region, grapes",
  ]) {
    const result = await supabase
      .from("canonical_wines")
      .select(select)
      .eq("id", wineId)
      .maybeSingle();
    if (!result.error) {
      if (!result.data) return null;
      const row = result.data as unknown as Record<string, unknown>;
      const nested = row.wineries;
      const wineryRow = Array.isArray(nested)
        ? (nested[0] as Record<string, unknown> | undefined)
        : (nested as Record<string, unknown> | null | undefined);
      const shares = parseGrapeShares(row.grapes);
      return {
        id: String(row.id),
        name: String(row.name ?? ""),
        winery: String(row.winery ?? wineryRow?.name ?? ""),
        region: (row.region as string | null) ?? (wineryRow?.region as string | null) ?? null,
        grapes: shares.length ? shares : (row.grapes as CanonicalWine["grapes"]),
        color: (row.color as string | null) ?? null,
        wine_type: (row.wine_type as string | null) ?? null,
        winery_id: (row.winery_id as string | null) ?? (wineryRow?.id as string | null) ?? null,
        country: (wineryRow?.country as string | null) ?? null,
        country_code: (wineryRow?.country_code as string | null) ?? null,
        winery_region: (wineryRow?.region as string | null) ?? null,
      };
    }
    if (!isMissingColumn(result.error.message)) throw new Error(result.error.message);
  }
  return null;
}

export function useWine(wineId: string | null) {
  return useSWR(
    wineId ? CACHE_KEYS.wine(wineId) : null,
    () => fetchWine(wineId as string),
    { keepPreviousData: true }
  );
}

export function useWineTickets(wineId: string | null) {
  return useSWR(
    wineId ? CACHE_KEYS.wineTickets(wineId) : null,
    () => fetchTickets({ wineId: wineId as string }),
    { keepPreviousData: true }
  );
}

export async function searchWines(query: string, limit = 12): Promise<CanonicalWine[]> {
  return searchWineCatalog(query, limit);
}

export function useWineSearch(query: string) {
  return useSWR(
    isSupabaseConfigured() ? CACHE_KEYS.wines(query.trim()) : null,
    () => searchWines(query),
    {
      keepPreviousData: true,
      dedupingInterval: 8_000,
    }
  );
}

export function revalidateWines() {
  void globalMutate(
    (key) => Array.isArray(key) && key[0] === "wines",
    undefined,
    { revalidate: true }
  );
  void globalMutate(CACHE_KEYS.catalog);
}

export function revalidateProfile(userId: string) {
  void globalMutate(CACHE_KEYS.profile(userId));
  void globalMutate(
    (key) => Array.isArray(key) && key[0] === "profile-username",
    undefined,
    { revalidate: true }
  );
  void globalMutate(CACHE_KEYS.tickets);
  void globalMutate(CACHE_KEYS.myTickets(userId));
}

export function useFollowingIds(userId: string | null) {
  return useSWR(
    userId ? CACHE_KEYS.following(userId) : null,
    () => fetchFollowingIds(userId as string),
    { keepPreviousData: true }
  );
}

export function useFollowStats(userId: string | null) {
  return useSWR(
    userId ? CACHE_KEYS.followStats(userId) : null,
    () => fetchFollowStats(userId as string),
    { keepPreviousData: true }
  );
}

export async function fetchDiscoveryFeed(viewerId: string | null) {
  const recent = await fetchTickets({ limit: DISCOVERY_POOL });
  if (!viewerId) {
    return rankDiscoveryFeed({
      tickets: recent,
      followedIds: [],
      taste: emptyTasteProfile(),
      viewerId: null,
    });
  }

  const [followedIds, mutedIds] = await Promise.all([
    fetchFollowingIds(viewerId),
    fetchMutedIds(viewerId),
  ]);
  const muted = new Set(mutedIds);
  const [tasteSource, friendTickets] = await Promise.all([
    fetchTickets({ userId: viewerId }),
    fetchTickets({
      userIds: followedIds.filter((id) => !muted.has(id)),
      limit: DISCOVERY_POOL,
    }),
  ]);

  return rankDiscoveryFeed({
    tickets: mergeTickets(friendTickets, recent).filter(
      (ticket) => !ticket.userId || !muted.has(ticket.userId)
    ),
    followedIds,
    taste: buildTasteProfile(tasteSource),
    viewerId,
  });
}

export function useDiscoveryFeed() {
  const { data: viewerId, isLoading: sessionLoading } = useSessionUserId();
  const sessionReady = !sessionLoading || viewerId !== undefined;

  return useSWR(
    isSupabaseConfigured() && sessionReady
      ? CACHE_KEYS.discovery(viewerId ?? null)
      : null,
    () => fetchDiscoveryFeed(viewerId ?? null),
    { keepPreviousData: true }
  );
}

export function useMutedIds(userId: string | null) {
  return useSWR(
    userId ? CACHE_KEYS.mutes(userId) : null,
    () => fetchMutedIds(userId as string),
    { keepPreviousData: true }
  );
}

export function useFollowList(
  userId: string | null,
  kind: "followers" | "following"
) {
  return useSWR(
    userId ? CACHE_KEYS.followList(userId, kind) : null,
    () => fetchFollowList(userId as string, kind),
    { keepPreviousData: true }
  );
}

export function usePeopleSearch(query: string) {
  return useSWR(
    isSupabaseConfigured() ? CACHE_KEYS.people(query.trim()) : null,
    () => searchPeople(query),
    { keepPreviousData: true, dedupingInterval: 8_000 }
  );
}

export type WineCatalog = {
  wines: CanonicalWine[];
  tickets: HangTicketView[];
};

export async function fetchWineCatalog(): Promise<WineCatalog> {
  const [wines, tickets] = await Promise.all([
    searchWines("", 200),
    fetchTickets({ limit: 120 }),
  ]);
  return { wines, tickets };
}

export function useWineCatalog() {
  return useSWR(
    isSupabaseConfigured() ? CACHE_KEYS.catalog : null,
    fetchWineCatalog,
    { keepPreviousData: true }
  );
}

export type AppNotification = {
  id: string;
  kind: "follow" | "friend_ticket";
  createdAt: string;
  actor: ProfileRow;
  ticket?: HangTicketView;
};

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const supabase = createClient();
  const [followers, followingIds, mutedIds] = await Promise.all([
    fetchFollowList(userId, "followers"),
    fetchFollowingIds(userId),
    fetchMutedIds(userId),
  ]);
  const muted = new Set(mutedIds);

  const { data: followRows } = await supabase
    .from("follows")
    .select("follower_id, created_at")
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  const followByActor = new Map(
    (followRows ?? []).map((row) => [row.follower_id as string, row.created_at as string])
  );

  const followNotes: AppNotification[] = followers
    .filter((actor) => actor.id && !muted.has(actor.id))
    .map((actor) => ({
      id: `follow:${actor.id}`,
      kind: "follow" as const,
      createdAt: followByActor.get(actor.id as string) ?? new Date().toISOString(),
      actor,
    }));

  const visibleFriends = followingIds.filter((id) => !muted.has(id));
  const friendTickets =
    visibleFriends.length > 0
      ? await fetchTickets({ userIds: visibleFriends, limit: 30 })
      : [];

  const ticketNotes: AppNotification[] = friendTickets
    .filter((ticket) => ticket.userId && ticket.userId !== userId)
    .map((ticket) => ({
      id: `ticket:${ticket.id}`,
      kind: "friend_ticket" as const,
      createdAt: ticket.createdAt ?? new Date(0).toISOString(),
      actor: {
        id: ticket.userId,
        username: ticket.username,
        display_name: ticket.displayName,
        avatar_url: ticket.avatarUrl ?? null,
      },
      ticket,
    }));

  return [...followNotes, ...ticketNotes].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
  );
}

export function useNotifications(userId: string | null) {
  return useSWR(
    userId ? CACHE_KEYS.notifications(userId) : null,
    () => fetchNotifications(userId as string),
    { keepPreviousData: true }
  );
}

export function unreadNotificationCount(items: AppNotification[] | undefined) {
  if (!items?.length) return 0;
  const seen = readSeenNotificationIds();
  return items.filter((item) => !seen.has(item.id)).length;
}

export { markNotificationsSeen, readSeenNotificationIds };
