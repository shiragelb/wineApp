import {
  profileHandle,
  profileTitle,
  type ProfileRow,
} from "@/lib/profile";

export type HangTicketView = {
  id: string;
  username: string;
  displayName: string;
  handle: string | null;
  avatarUrl?: string;
  wine: string;
  winery: string;
  region: string;
  rating: number;
  review: string;
  imageUrl?: string;
  tone?: string;
};

export type CanonicalWine = {
  id: string;
  name: string;
  winery: string;
  region: string | null;
  grapes?: string | null;
};

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type TicketRow = {
  id: string;
  image_url: string;
  rating: number;
  review_text: string | null;
  profiles:
    | Pick<ProfileRow, "username" | "display_name" | "avatar_url">
    | Pick<ProfileRow, "username" | "display_name" | "avatar_url">[]
    | null;
  canonical_wines:
    | { name: string; winery: string; region: string | null }
    | { name: string; winery: string; region: string | null }[]
    | null;
};

export function mapTicketRow(row: TicketRow): HangTicketView {
  const profile = asOne(row.profiles);
  const wine = asOne(row.canonical_wines);
  const safeProfile = {
    username: profile?.username ?? "guest",
    display_name: profile?.display_name ?? null,
  };

  return {
    id: row.id,
    username: safeProfile.username,
    displayName: profileTitle(safeProfile),
    handle: profileHandle(safeProfile),
    avatarUrl: profile?.avatar_url ?? undefined,
    wine: wine?.name ?? "Unknown bottle",
    winery: wine?.winery ?? "Unknown winery",
    region: wine?.region ?? "",
    rating: row.rating,
    review: row.review_text ?? "",
    imageUrl: row.image_url,
  };
}

export const hangTicketSelect = `
  id,
  image_url,
  rating,
  review_text,
  profiles ( username, display_name, avatar_url ),
  canonical_wines ( name, winery, region )
` as const;

export const hangTicketSelectFallback = `
  id,
  image_url,
  rating,
  review_text,
  profiles ( username, avatar_url ),
  canonical_wines ( name, winery, region )
` as const;

export const CACHE_KEYS = {
  tickets: "hang-tickets",
  session: "auth-session",
  profile: (userId: string) => ["profile", userId] as const,
  myTickets: (userId: string) => ["hang-tickets", userId] as const,
  wines: (query: string) => ["wines", query] as const,
};
