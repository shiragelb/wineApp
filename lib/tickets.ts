export type HangTicketView = {
  id: string;
  username: string;
  wine: string;
  winery: string;
  region: string;
  rating: number;
  review: string;
  imageUrl?: string;
  tone?: string;
};

export type PlaceholderWine = {
  id: string;
  name: string;
  winery: string;
  region: string | null;
};

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type TicketRow = {
  id: string;
  image_url: string;
  rating: number;
  review_text: string | null;
  profiles: { username: string } | { username: string }[] | null;
  canonical_wines:
    | { name: string; winery: string; region: string | null }
    | { name: string; winery: string; region: string | null }[]
    | null;
};

export function mapTicketRow(row: TicketRow): HangTicketView {
  const profile = asOne(row.profiles);
  const wine = asOne(row.canonical_wines);

  return {
    id: row.id,
    username: profile?.username ?? "guest",
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
  profiles ( username ),
  canonical_wines ( name, winery, region )
` as const;
