import type { HangTicketView } from "@/lib/tickets";

/** Social graph is the majority signal so friends stay in front. */
export const FEED_WEIGHTS = {
  social: 0.55,
  taste: 0.3,
  recency: 0.15,
} as const;

export const TASTE_MIN_RATING = 4;
export const RECENCY_HALF_LIFE_HOURS = 72;
export const DISCOVERY_POOL = 80;
export const DISCOVERY_FEED_SIZE = 40;

export type TasteProfile = {
  wineIds: Set<string>;
  grapes: Set<string>;
  wineries: Set<string>;
  regions: Set<string>;
};

export function emptyTasteProfile(): TasteProfile {
  return {
    wineIds: new Set(),
    grapes: new Set(),
    wineries: new Set(),
    regions: new Set(),
  };
}

export function isTasteEmpty(taste: TasteProfile) {
  return (
    taste.wineIds.size === 0 &&
    taste.grapes.size === 0 &&
    taste.wineries.size === 0 &&
    taste.regions.size === 0
  );
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function tokenizeGrapes(grapes?: string | null) {
  if (!grapes) return [];
  return grapes
    .toLowerCase()
    .split(/[,+/&]| and /g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function regionTokens(region?: string | null) {
  if (!region) return [];
  return region
    .split(/[,/|]/)
    .map(normalize)
    .filter((token) => token.length > 2);
}

export function buildTasteProfile(tickets: HangTicketView[]): TasteProfile {
  const taste = emptyTasteProfile();

  for (const ticket of tickets) {
    if (ticket.rating < TASTE_MIN_RATING) continue;
    if (ticket.wineId) taste.wineIds.add(ticket.wineId);
    for (const grape of tokenizeGrapes(ticket.grapes)) {
      taste.grapes.add(grape);
    }
    if (ticket.winery) taste.wineries.add(normalize(ticket.winery));
    for (const region of regionTokens(ticket.region)) {
      taste.regions.add(region);
    }
  }

  return taste;
}

export function socialScore(
  ticket: HangTicketView,
  followedIds: Set<string>,
  viewerId: string | null
) {
  if (!ticket.userId) return 0;
  if (followedIds.has(ticket.userId)) return 1;
  if (viewerId && ticket.userId === viewerId) return 0.25;
  return 0;
}

export function tasteScore(ticket: HangTicketView, taste: TasteProfile) {
  if (isTasteEmpty(taste)) return 0;

  let score = 0;
  if (ticket.wineId && taste.wineIds.has(ticket.wineId)) {
    score = Math.max(score, 1);
  }

  const grapes = tokenizeGrapes(ticket.grapes);
  if (grapes.length > 0 && taste.grapes.size > 0) {
    let intersection = 0;
    const union = new Set(taste.grapes);
    for (const grape of grapes) {
      if (taste.grapes.has(grape)) intersection += 1;
      union.add(grape);
    }
    score = Math.max(score, intersection / union.size);
  }

  if (ticket.winery && taste.wineries.has(normalize(ticket.winery))) {
    score = Math.max(score, 0.55);
  }

  const regions = regionTokens(ticket.region);
  if (regions.some((region) => taste.regions.has(region))) {
    score = Math.max(score, 0.35);
  }

  return score;
}

export function recencyScore(createdAt: string | undefined, now = Date.now()) {
  if (!createdAt) return 0.5;
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return 0.5;
  const ageHours = Math.max(0, (now - created) / 3_600_000);
  return Math.exp((-ageHours * Math.LN2) / RECENCY_HALF_LIFE_HOURS);
}

export function compositeScore(input: {
  ticket: HangTicketView;
  followedIds: Set<string>;
  taste: TasteProfile;
  viewerId: string | null;
  now?: number;
}) {
  const social = socialScore(input.ticket, input.followedIds, input.viewerId);
  const taste = tasteScore(input.ticket, input.taste);
  const recency = recencyScore(input.ticket.createdAt, input.now);
  return (
    FEED_WEIGHTS.social * social +
    FEED_WEIGHTS.taste * taste +
    FEED_WEIGHTS.recency * recency
  );
}

export function rankDiscoveryFeed(input: {
  tickets: HangTicketView[];
  followedIds: Iterable<string>;
  taste: TasteProfile;
  viewerId: string | null;
  now?: number;
  limit?: number;
}) {
  const followedIds = input.followedIds instanceof Set
    ? input.followedIds
    : new Set(input.followedIds);
  const now = input.now ?? Date.now();
  const ranked = [...input.tickets].sort((left, right) => {
    const delta =
      compositeScore({
        ticket: right,
        followedIds,
        taste: input.taste,
        viewerId: input.viewerId,
        now,
      }) -
      compositeScore({
        ticket: left,
        followedIds,
        taste: input.taste,
        viewerId: input.viewerId,
        now,
      });
    if (delta !== 0) return delta;
    return Date.parse(right.createdAt ?? "") - Date.parse(left.createdAt ?? "");
  });

  return ranked.slice(0, input.limit ?? DISCOVERY_FEED_SIZE);
}

export function mergeTickets(...groups: HangTicketView[][]) {
  const byId = new Map<string, HangTicketView>();
  for (const group of groups) {
    for (const ticket of group) {
      byId.set(ticket.id, ticket);
    }
  }
  return [...byId.values()];
}
