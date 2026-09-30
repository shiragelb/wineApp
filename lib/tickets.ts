import {
  profileHandle,
  profileTitle,
  publicAvatarUrl,
  type ProfileRow,
} from "@/lib/profile";
import {
  formatGrapeLabel,
  parseGrapeShares,
  type GrapeShare,
} from "@/lib/wine-meta";

export type HangTicketView = {
  id: string;
  userId?: string;
  wineId?: string;
  username: string;
  displayName: string;
  handle: string | null;
  avatarUrl?: string;
  wine: string;
  winery: string;
  region: string;
  grapes?: string;
  grapeShares?: GrapeShare[];
  wineType?: string | null;
  country?: string | null;
  countryCode?: string | null;
  rating: number;
  review: string;
  imageUrl?: string;
  createdAt?: string;
  price?: number;
  tone?: string;
};

export type CanonicalWine = {
  id: string;
  name: string;
  winery: string;
  region: string | null;
  grapes?: string | GrapeShare[] | null;
  color?: string | null;
  wine_type?: string | null;
  winery_id?: string | null;
  country?: string | null;
  country_code?: string | null;
  winery_region?: string | null;
};

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type TicketRow = {
  id: string;
  user_id: string;
  wine_id: string;
  image_url: string;
  rating: number;
  review_text: string | null;
  created_at?: string;
  price?: number | string | null;
  profiles:
    | Pick<ProfileRow, "username" | "display_name" | "avatar_url">
    | Pick<ProfileRow, "username" | "display_name" | "avatar_url">[]
    | null;
  canonical_wines:
    | {
        id?: string;
        name: string;
        winery: string;
        region: string | null;
        grapes?: string | GrapeShare[] | null;
        color?: string | null;
        wine_type?: string | null;
        winery_id?: string | null;
        wineries?:
          | {
              id?: string;
              name?: string;
              country?: string | null;
              country_code?: string | null;
              region?: string | null;
            }
          | {
              id?: string;
              name?: string;
              country?: string | null;
              country_code?: string | null;
              region?: string | null;
            }[]
          | null;
      }
    | {
        id?: string;
        name: string;
        winery: string;
        region: string | null;
        grapes?: string | GrapeShare[] | null;
        color?: string | null;
        wine_type?: string | null;
        winery_id?: string | null;
        wineries?:
          | {
              id?: string;
              name?: string;
              country?: string | null;
              country_code?: string | null;
              region?: string | null;
            }
          | {
              id?: string;
              name?: string;
              country?: string | null;
              country_code?: string | null;
              region?: string | null;
            }[]
          | null;
      }[]
    | null;
};

export function mapTicketRow(row: TicketRow): HangTicketView {
  const profile = asOne(row.profiles);
  const wine = asOne(row.canonical_wines);
  const wineryMeta = asOne(wine?.wineries ?? null);
  const safeProfile = {
    username: profile?.username ?? "guest",
    display_name: profile?.display_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
  };
  const grapeShares = parseGrapeShares(wine?.grapes);

  return {
    id: row.id,
    userId: row.user_id,
    wineId: wine?.id ?? row.wine_id,
    username: safeProfile.username,
    displayName: profileTitle(safeProfile),
    handle: profileHandle(safeProfile),
    avatarUrl: publicAvatarUrl(profile?.avatar_url),
    wine: wine?.name ?? "Unknown bottle",
    winery: wine?.winery ?? wineryMeta?.name ?? "Unknown winery",
    region: wine?.region ?? wineryMeta?.region ?? "",
    grapes: formatGrapeLabel(grapeShares) ?? undefined,
    grapeShares,
    wineType: wine?.wine_type ?? wine?.color ?? null,
    country: wineryMeta?.country ?? null,
    countryCode: wineryMeta?.country_code ?? null,
    rating: row.rating,
    review: row.review_text ?? "",
    imageUrl: row.image_url,
    createdAt: row.created_at,
    price: row.price == null || row.price === "" ? undefined : Number(row.price),
  };
}

export const hangTicketSelect = `
  id,
  user_id,
  wine_id,
  image_url,
  rating,
  review_text,
  created_at,
  price,
  profiles ( username, display_name, avatar_url ),
  canonical_wines (
    id, name, winery, region, grapes, color, wine_type, winery_id,
    wineries ( id, name, country, country_code, region )
  )
` as const;

export const hangTicketSelectMid = `
  id,
  user_id,
  wine_id,
  image_url,
  rating,
  review_text,
  created_at,
  price,
  profiles ( username, display_name, avatar_url ),
  canonical_wines ( id, name, winery, region, grapes, color, wine_type )
` as const;

export const hangTicketSelectFallback = `
  id,
  user_id,
  wine_id,
  image_url,
  rating,
  review_text,
  created_at,
  profiles ( username, avatar_url ),
  canonical_wines ( id, name, winery, region, grapes )
` as const;

export const CACHE_KEYS = {
  tickets: "hang-tickets",
  session: "auth-session",
  profile: (userId: string) => ["profile", userId] as const,
  profileByUsername: (username: string) => ["profile-username", username] as const,
  myTickets: (userId: string) => ["hang-tickets", userId] as const,
  wine: (wineId: string) => ["wine", wineId] as const,
  wineTickets: (wineId: string) => ["wine-tickets", wineId] as const,
  wines: (query: string) => ["wines", query] as const,
  following: (userId: string) => ["following", userId] as const,
  followStats: (userId: string) => ["follow-stats", userId] as const,
  followList: (userId: string, kind: "followers" | "following") =>
    ["follow-list", userId, kind] as const,
  mutes: (userId: string) => ["mutes", userId] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
  people: (query: string) => ["people", query] as const,
  catalog: "wine-catalog",
  discovery: (viewerId: string | null) =>
    ["discovery-feed", viewerId ?? "anon"] as const,
};

export function profilePath(username: string) {
  return `/u/${encodeURIComponent(username)}`;
}

export function winePath(wineId: string) {
  return `/wine/${encodeURIComponent(wineId)}`;
}
