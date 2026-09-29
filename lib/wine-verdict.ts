import type { HangTicketView } from "@/lib/tickets";

export type WineVerdict = {
  tickets: number;
  friendTickets: number;
  average: number | null;
  friendAverage: number | null;
  averagePrice: number | null;
};

export function wineVerdict(
  wineId: string,
  tickets: HangTicketView[],
  friendIds: Iterable<string> = []
): WineVerdict {
  const friends = new Set(friendIds);
  const all = tickets.filter((ticket) => ticket.wineId === wineId);
  const fromFriends = all.filter((ticket) => ticket.userId && friends.has(ticket.userId));
  const prices = all
    .map((ticket) => ticket.price)
    .filter((price): price is number => typeof price === "number" && Number.isFinite(price) && price > 0);

  function average(list: HangTicketView[]) {
    if (list.length === 0) return null;
    return list.reduce((sum, ticket) => sum + ticket.rating, 0) / list.length;
  }

  return {
    tickets: all.length,
    friendTickets: fromFriends.length,
    average: average(all),
    friendAverage: average(fromFriends),
    averagePrice: prices.length
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : null,
  };
}

export function formatScore(value: number | null) {
  if (value == null) return "—";
  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatPrice(value: number | null) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
